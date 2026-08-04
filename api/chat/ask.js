import Groq from 'groq-sdk';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, history = [], context = '' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY is missing.' });
    }

    const systemPrompt = `You are the SavannaExplorer Travel Assistant — a friendly, knowledgeable AI concierge specializing in Southern Africa travel (South Africa, Namibia, Botswana, Zimbabwe, Zambia, Mozambique, Malawi, Lesotho, Eswatini).

RULES:
1. Answer ONLY questions about Southern Africa travel, tourism, safari, culture, logistics, visas, health, and related topics.
2. If asked about anything unrelated, politely redirect: "I'm your Southern Africa travel specialist! Ask me about destinations, visas, parks, borders, or anything travel-related in the region."
3. Keep responses concise but informative — aim for 2-4 short paragraphs max.
4. Use relevant emojis sparingly for warmth (🦁 🌍 🏔️ etc).
5. When referencing a specific topic, suggest which section of SavannaExplorer the user can visit for more detail using this format: [Section Name](#hash) — valid sections include: #destinations, #parks, #borders, #itineraries, #transport, #health, #embassies, #events, #book-direct, #plan
6. Always include a practical tip or lesser-known fact when relevant.
7. If you're unsure about specific current prices, visa rules, or regulations, say so and recommend the user verify with official sources.

CONTEXT FROM SAVANNAEXPLORER DATABASE:
${context}

Use the above context to ground your answers in real data from the site. If the context doesn't cover the question, use your general knowledge but note it.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      // Include recent conversation history (last 6 turns max)
      ...history.slice(-6),
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
    const linkRegex = /\[([^\]]+)\]\((#[a-z-]+)\)/g;
    const suggestedLinks = [];
    let match;
    while ((match = linkRegex.exec(reply)) !== null) {
      suggestedLinks.push({ label: match[1], hash: match[2] });
    }

    res.status(200).json({ reply, suggestedLinks });
  } catch (error) {
    console.error('Chat assistant error:', error);
    res.status(500).json({
      error: 'Failed to get response',
      details: error.message || error.toString(),
    });
  }
}
