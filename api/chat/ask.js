import Groq from 'groq-sdk';
import { observeRequest } from '../_lib/observability.js';
import countries from '../../data/countries.json' with { type: 'json' };
import routes from '../../data/route-collections.json' with { type: 'json' };
import parks from '../../data/parks.json' with { type: 'json' };
import borders from '../../data/borders.json' with { type: 'json' };
import health from '../../data/health.json' with { type: 'json' };

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 6;

function cleanText(value, maxLength = 200) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validateHistory(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_MESSAGES) return null;
  const result = [];
  for (const item of value) {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') return null;
    const content = item.content.trim();
    if (!content || content.length > 2500) return null;
    result.push({ role: item.role, content });
  }
  return result;
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return null;
  const configured = (process.env.ALLOWED_ORIGINS || 'https://savannaexplorer.com,http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(value => value.trim()).filter(Boolean);
  return configured.includes(origin) ? origin : false;
}

export function buildChatContext() {
  const countrySummary = Object.entries(countries)
    .map(([id, country]) => `${id}: ${cleanText(country.name, 60)} — ${cleanText(country.tagline, 100)}`)
    .join('; ');
  const routeSummary = routes.routes.slice(0, 19)
    .map(route => {
      const source = route.officialSources?.[0]?.url || 'open the route page for sources';
      return `${route.title} (${route.countryIds.join(', ')}, ${route.duration.label}, ${route.vehicle.label}, reviewed ${route.lastReviewed}; source ${source})`;
    })
    .join('; ');
  const parkSummary = parks.slice(0, 15)
    .map(park => `${park.name} (${park.country}; ${park.bestSeason}; reviewed ${park.lastVerified}; source ${park.sourceUrl})`)
    .join('; ');
  const borderSummary = borders.slice(0, 15)
    .map(border => `${border.name} (${border.countries.join(' ↔ ')}; published hours: ${border.hours}; reviewed ${border.lastVerified}; source ${border.sourceUrl})`)
    .join('; ');
  const healthSummary = (health.countries || []).map(country => (
    `${country.name}: ${country.malariaSummary}; yellow fever: ${country.yellowFever}; reviewed ${country.lastVerified}; source ${country.sourceUrl}`
  )).join('; ');

  return [
    `COUNTRIES: ${countrySummary}`,
    `REVIEWED ROUTES: ${routeSummary}`,
    `PARK SNAPSHOT: ${parkSummary}`,
    `BORDER SNAPSHOT: ${borderSummary}`,
    `HEALTH SNAPSHOT: ${healthSummary}`,
  ].join('\n\n').slice(0, 14000);
}

export const CHAT_SYSTEM_INSTRUCTION = `You are Savanna Explorer's independent Southern Africa planning assistant.
Answer only travel-planning questions about South Africa, Namibia, Botswana, Zimbabwe, Zambia, Mozambique, Malawi, Lesotho and Eswatini.
- Savanna Explorer is an editorial planning resource, not a travel agency. Never claim to book, quote, confirm availability or accept payment.
- Keep answers concise, practical and calm. Do not add trivia simply to sound authoritative.
- Treat prices, entry rules, health advice, border hours, park fees and operating schedules as time-sensitive. State the review date when supplied and tell the traveller to verify the linked official source.
- Never invent a live condition or fill a missing fact from memory. If the supplied context does not answer a time-sensitive question, say what must be checked.
- Link to the most relevant site area when helpful: [Routes](/routes), [Countries](/destinations), [Parks](/parks), [Borders](/borders), [Health](/health), [Transport](/transport), [Events](/events), [Book direct](/book-direct), or [My Safari](/my-safari).
- Finish high-stakes answers with the exact next verification step, not a generic sales call.`;

export default async function handler(req, res) {
  const observation = observeRequest(req, res, '/api/chat/ask');
  const origin = allowedOrigin(req);
  if (origin === false) return res.status(403).json({ error: 'Origin not allowed' });
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const message = cleanText(body.message, MAX_MESSAGE_LENGTH);
    const history = validateHistory(body.history);

    if (!message || (typeof body.message === 'string' && body.message.trim().length > MAX_MESSAGE_LENGTH)) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (history === null) return res.status(400).json({ error: 'Invalid conversation history' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      observation.error({ name: 'ConfigurationError' }, 503);
      return res.status(503).json({ error: 'Assistant service is unavailable.' });
    }

    const systemPrompt = `${CHAT_SYSTEM_INSTRUCTION}\n\nREVIEWED SITE CONTEXT:\n${buildChatContext()}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    const groq = new Groq({ apiKey });
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 1500,
    });

    const reply = chatCompletion.choices[0]?.message?.content || '';

    // Extract suggested site links from the reply
    const linkRegex = /\[([^\]]+)\]\((\/[a-z0-9\-/]+)\)/gi;
    const suggestedLinks = [];
    let match;
    while ((match = linkRegex.exec(reply)) !== null) {
      suggestedLinks.push({ label: match[1], path: match[2] });
    }

    res.status(200).json({ reply, suggestedLinks });
  } catch (error) {
    observation.error(error);
    res.status(500).json({
      error: 'Failed to get response',
    });
  }
}
