const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/itinerary/generate', async (req, res) => {
  try {
    const { country, duration, category, budget, matches } = req.body;

    if (!country || !duration || !category || !budget) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('API key not found');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are a premium, expert African Safari itinerary designer for SavannaExplorer. Your itineraries are immersive, beautifully structured, practical for a traveler, and written in a luxurious and enthusiastic tone. Use professional knowledge about travel logistics, local restaurants, seasonal weather, packing advice, and wildlife behaviors."
    });

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

    const result = await model.generateContent(prompt);
    const itinerary = result.response.text();

    res.status(200).json({ itinerary });
  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({ error: 'Failed to generate itinerary' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Relay service listening on port ${port}`);
});
