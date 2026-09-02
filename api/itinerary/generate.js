import Groq from 'groq-sdk';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARACTERS = 16000;
const MAX_MATCHES = 12;
const rateLimitStore = new Map();
const DEFAULT_ITINERARY_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

export const ITINERARY_SYSTEM_INSTRUCTION = `You are the independent travel-planning assistant for Savanna Explorer.
Create practical, engaging Southern Africa itinerary drafts while following these rules:
- Savanna Explorer is an editorial planning resource, not a travel agency. Never claim that it can book, reserve, quote, confirm availability, lock in dates, or accept payment.
- Never tell the traveler to contact Savanna Explorer to arrange a trip. Direct them to official authorities or operators for verification and booking.
- Keep routing realistic for the requested duration. Do not combine distant regions unless the necessary travel time is clearly included.
- Treat prices, accommodation, transport schedules, opening times, visa rules, health guidance, and availability as unverified planning information. Tell travelers to confirm them with official sources.
- Do not invent exact flight times, lodge availability, permits, or prices. When a named item is not supplied in the verified catalog context, label it as an example to research.
- Distinguish catalog experiences from general suggestions, and only use the SavannaExplorer Experience badge for catalog items supplied in the prompt.
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
      console.warn(`Groq model ${model} is unavailable; trying the next configured itinerary model.`);
    }
  }

  throw lastError;
}

function cleanText(value, maxLength = 200) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
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
  const configured = (process.env.ALLOWED_ORIGINS || 'https://savannaexplorer.com,http://localhost:5173')
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
    const matches = Array.isArray(body.matches) ? body.matches.slice(0, MAX_MATCHES) : [];

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

      let catalog_context = "";
      if (matches && matches.length > 0) {
        catalog_context = "Here are the REAL, verified experiences from our catalog that we MUST feature/include in the itinerary if they fit geographically:\n";
        matches.forEach(m => {
          const title = cleanText(m?.title, 160);
          const location = cleanText(m?.location, 100);
          const description = cleanText(m?.description, 500);
          const matchCategory = cleanText(m?.category, 80);
          const priceRange = cleanText(m?.price_range, 20);
          if (title) catalog_context += `- '${title}' (${location}): ${description} (Category: ${matchCategory}, Price: ${priceRange})\n`;
        });
      } else {
        catalog_context = "No direct catalog matches found. Please design a custom itinerary using popular local attractions in Southern Africa.\n";
      }

      const prompt = `Generate a customized, luxury ${duration}-day travel itinerary.
Destination Country: ${country}
Primary Theme: ${category}
Budget Tier: ${budget}

${catalog_context}
Instructions:
1. Write a Day-by-Day schedule detailing Morning, Afternoon, and Evening/Night activities.
2. Ensure travel logistics between locations are realistic and include transfer notes (e.g. drive times or flight transfers).
3. Explicitly reference our real catalog experiences with a bold badge (e.g. '**[SavannaExplorer Experience: 5-Day Classic Kruger Safari]**') when they are scheduled.
4. Include a section on 'Local Culinary Highlights' (traditional food/drink to try) and 'Expert Safari Travel Tips'.`;

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
      console.error('No GROQ_API_KEY found in environment.');
      return res.status(500).json({ 
        error: 'Generation failed', 
        details: 'GROQ_API_KEY is missing.' 
      });
    }

    const groq = new Groq({ apiKey: apiKey });

    const { completion: chatCompletion, model } = await generateItineraryCompletion(groq, messages);

    const itinerary = chatCompletion.choices[0]?.message?.content || "";
    const methodUsed = `Groq (${model})`;
    console.log(`SUCCESS: Generated itinerary via Groq (${model}).`);

    res.status(200).json({ itinerary, method: methodUsed });
  } catch (error) {
    console.error('Error generating itinerary in relay:', error);
    res.status(500).json({ 
      error: 'Failed to generate itinerary', 
      details: error.message || error.toString() 
    });
  }
};
