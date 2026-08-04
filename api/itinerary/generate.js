import Groq from 'groq-sdk';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { country, duration, category, budget, matches } = req.body;

    if (!country || !duration || !category || !budget) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const systemInstruction = "You are a premium, expert African Safari itinerary designer for SavannaExplorer. Your itineraries are immersive, beautifully structured, practical for a traveler, and written in a luxurious and enthusiastic tone. Use professional knowledge about travel logistics, local restaurants, seasonal weather, packing advice, and wildlife behaviors.";

    let catalog_context = "";
    if (matches && matches.length > 0) {
      catalog_context = "Here are the REAL, verified experiences from our catalog that we MUST feature/include in the itinerary if they fit geographically:\n";
      matches.forEach(m => {
        catalog_context += `- '${m.title}' (${m.location}): ${m.description} (Category: ${m.category}, Price: ${m.price_range})\n`;
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
4. Include a section on 'Local Culinary Highlights' (traditional food/drink to try) and 'Expert Safari Travel Tips'.
5. Output the result in beautiful, clean markdown with plenty of relevant emojis.`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('No GROQ_API_KEY found in environment.');
      return res.status(500).json({ 
        error: 'Generation failed', 
        details: 'GROQ_API_KEY is missing.' 
      });
    }

    const groq = new Groq({ apiKey: apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 8000,
    });

    const itinerary = chatCompletion.choices[0]?.message?.content || "";
    const methodUsed = "Groq (llama-3.3-70b-versatile)";
    console.log("SUCCESS: Generated itinerary via Groq.");

    res.status(200).json({ itinerary, method: methodUsed });
  } catch (error) {
    console.error('Error generating itinerary in relay:', error);
    res.status(500).json({ 
      error: 'Failed to generate itinerary', 
      details: error.message || error.toString() 
    });
  }
};
