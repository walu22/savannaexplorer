import Groq from 'groq-sdk';
import { observeRequest } from '../_lib/observability.js';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARACTERS = 16000;
const MAX_ROUTE_MATCHES = 6;
const rateLimitStore = new Map();
const DEFAULT_ITINERARY_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

export const ITINERARY_SYSTEM_INSTRUCTION = `You are the independent travel-planning assistant for Savanna Explorer.
Create practical, engaging Southern Africa itinerary drafts while following these rules:
- Savanna Explorer is an editorial planning resource, not a travel agency. Never claim that it can book, reserve, quote, confirm availability, lock in dates, or accept payment.
- Never tell the traveler to contact Savanna Explorer to arrange a trip. Direct them to official authorities or operators for verification and booking.
- Keep routing realistic for the requested duration. Do not combine distant regions unless the necessary travel time is clearly included.
- Treat prices, accommodation, transport schedules, opening times, visa rules, health guidance, and availability as unverified planning information. Tell travelers to confirm them with official sources.
- Do not invent exact flight times, lodge availability, permits, or prices. When a named item is not supplied in the reviewed route context, label it as an example to research.
- Use supplied reviewed route templates only as planning anchors. They are not products, packages, bookings, or proof of live conditions.
- Reference a supplied route as [SavannaExplorer Route: Route title]. Never create a route reference that was not supplied in the prompt.
- Finish with a concise planning disclaimer, not a sales call to action.
Format the itinerary in clear markdown with a realistic day-by-day schedule, transfer notes, local food ideas, responsible travel guidance, and relevant emojis.`;

function getItineraryModels() {
  return [...new Set([process.env.GROQ_ITINERARY_MODEL, ...DEFAULT_ITINERARY_MODELS].filter(Boolean))];
}

function isModelUnavailable(error) {
  const message = String(error?.message || error).toLowerCase();
  return [400, 403, 404].includes(error?.status)
    && (message.includes('model') || message.includes('access'));
}

export async function generateItineraryCompletion(groq, messages, models = getItineraryModels()) {
  let lastError;

  for (const [index, model] of models.entries()) {
    try {
      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature: 0.7,
        max_tokens: 4000,
      });
      return { completion, model };
    } catch (error) {
      lastError = error;
      if (index === models.length - 1 || !isModelUnavailable(error)) throw error;
      console.warn(JSON.stringify({ level: 'warn', message: 'itinerary_model_fallback', model }));
    }
  }

  throw lastError;
}

function cleanText(value, maxLength = 200) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanStringList(value, limit = 6, itemLength = 180) {
  return Array.isArray(value)
    ? value.slice(0, limit).map(item => cleanText(item, itemLength)).filter(Boolean)
    : [];
}

export function buildReviewedRouteContext(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return 'No reviewed route template directly matched this request. Build a conservative draft and label named places or services as examples to research.';
  }

  const lines = matches.slice(0, MAX_ROUTE_MATCHES).map(match => {
    const title = cleanText(match?.title, 160);
    if (!title) return '';
    const countries = cleanStringList(match?.countryIds, 9, 40).join(', ');
    const promise = cleanText(match?.promise, 400);
    const duration = cleanText(match?.duration?.label, 60);
    const vehicle = cleanText(match?.vehicle?.label, 100);
    const season = cleanText(match?.bestSeason?.label, 100);
    const highlights = cleanStringList(match?.highlights).join('; ');
    const warnings = cleanStringList(match?.warnings).join('; ');
    const lastReviewed = cleanText(match?.lastReviewed, 20);
    const sources = Array.isArray(match?.officialSources)
      ? match.officialSources.slice(0, 5).map(source => {
          const label = cleanText(source?.label, 120);
          const url = cleanText(source?.url, 300);
          return label && /^https:\/\//i.test(url) ? `${label}: ${url}` : '';
        }).filter(Boolean).join('; ')
      : '';

    return [
      `- ${title}`,
      countries ? `countries: ${countries}` : '',
      promise ? `scope: ${promise}` : '',
      duration ? `duration: ${duration}` : '',
      vehicle ? `vehicle: ${vehicle}` : '',
      season ? `broad season: ${season}` : '',
      highlights ? `highlights: ${highlights}` : '',
      warnings ? `planning cautions: ${warnings}` : '',
      sources ? `official sources: ${sources}` : '',
      lastReviewed ? `last reviewed: ${lastReviewed}` : '',
    ].filter(Boolean).join(' | ');
  }).filter(Boolean);

  return lines.length
    ? `REVIEWED ROUTE TEMPLATES (planning anchors, not products or live advice):\n${lines.join('\n')}`
    : 'No reviewed route template directly matched this request. Build a conservative draft and label named places or services as examples to research.';
}

function getRequestIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return cleanText(Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0], 100)
    || cleanText(req.headers['x-real-ip'], 100)
    || req.socket?.remoteAddress
    || 'unknown';
}

function isRateLimited(req) {
  const now = Date.now();
  if (rateLimitStore.size > 1000) {
    for (const [storedKey, entry] of rateLimitStore) {
      if (entry.resetAt <= now) rateLimitStore.delete(storedKey);
    }
  }
  const key = getRequestIp(req);
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return null;
  const configured = (process.env.ALLOWED_ORIGINS || 'https://savannaexplorer.com,http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  return configured.includes(origin) ? origin : false;
}

function validateHistory(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_MESSAGES) return null;

  let totalCharacters = 0;
  const history = [];
  for (const item of value) {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') {
      return null;
    }
    const content = item.content.trim();
    totalCharacters += content.length;
    if (!content || content.length > 8000 || totalCharacters > MAX_HISTORY_CHARACTERS) return null;
    history.push({ role: item.role, content });
  }
  return history;
}

export default async function handler(req, res) {
  const observation = observeRequest(req, res, '/api/itinerary/generate');
  const origin = allowedOrigin(req);
  if (origin === false) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(req)) {
    res.setHeader('Retry-After', '600');
    return res.status(429).json({ error: 'Too many itinerary requests. Please try again later.' });
  }

  try {
    const body = req.body || {};
    const country = cleanText(body.country, 80);
    const duration = cleanText(String(body.duration ?? ''), 20);
    const category = cleanText(body.category, 80);
    const budget = cleanText(body.budget, 80);
    const message = cleanText(body.message, MAX_MESSAGE_LENGTH);
    const history = validateHistory(body.history);
    const matches = Array.isArray(body.matches) ? body.matches.slice(0, MAX_ROUTE_MATCHES) : [];

    if (typeof body.message === 'string' && body.message.trim().length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: 'Message is too long' });
    }
    if (history === null) {
      return res.status(400).json({ error: 'Invalid conversation history' });
    }

    let messages = [{ role: 'system', content: ITINERARY_SYSTEM_INSTRUCTION }];

    // If it's the first turn, construct the prompt from the form fields
    if (!message && history.length === 0) {
      if (!country || !duration || !category || !budget) {
        return res.status(400).json({ error: 'Missing required fields for initial generation' });
      }

      const routeContext = buildReviewedRouteContext(matches);

      const prompt = `Generate a practical ${duration}-day independent travel-planning draft.
Destination Country: ${country}
Primary Theme: ${category}
Budget Tier: ${budget}

${routeContext}
Instructions:
1. Write a Day-by-Day schedule detailing Morning, Afternoon, and Evening/Night activities.
2. Ensure travel logistics between locations are realistic and include transfer notes (e.g. drive times or flight transfers).
3. When a supplied route genuinely helps, reference it exactly as '[SavannaExplorer Route: Route title]'. Do not present route templates as products, packages, or bookable experiences.
4. Include a section on 'Local Culinary Highlights' (traditional food or drink to research) and practical independent-travel tips.`;

      messages.push({ role: 'user', content: prompt });
    } else {
      // Subsequent turns: append history and the new message
      if (history.length) {
        messages = messages.concat(history);
      }
      if (message) {
        messages.push({ role: 'user', content: message });
      }
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      observation.error({ name: 'ConfigurationError' }, 503);
      return res.status(503).json({
        error: 'Generation failed',
      });
    }

    const groq = new Groq({ apiKey: apiKey });

    const { completion: chatCompletion, model } = await generateItineraryCompletion(groq, messages);

    const itinerary = chatCompletion.choices[0]?.message?.content || "";
    const methodUsed = `Groq (${model})`;

    res.status(200).json({ itinerary, method: methodUsed });
  } catch (error) {
    observation.error(error);
    res.status(500).json({
      error: 'Failed to generate itinerary',
    });
  }
};
