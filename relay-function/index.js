const express = require('express');
const { GoogleGenAI } = require('@google/genai');
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

    let itinerary = null;
    let methodUsed = "";

    // Method 1: Try Enterprise Vertex AI Keyless via modern Gen AI SDK
    try {
      console.log("Attempting itinerary generation via modern Vertex AI Keyless route...");
      const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'tumahelper-auth';
      const location = process.env.GCP_LOCATION || 'us-central1';
      
      const ai = new GoogleGenAI({
        vertex: true,
        project: projectId,
        location: location
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 8192
        }
      });

      itinerary = response.text;
      methodUsed = "Vertex AI (Keyless IAM)";
      console.log("SUCCESS: Generated itinerary via Vertex AI.");
    } catch (vertexError) {
      console.warn("Vertex AI attempt failed. Falling back to Developer Gemini API... Error:", vertexError.message);
    }

    // Method 2: Fallback to Developer Gemini API Key
    if (!itinerary) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        console.error('No Gemini API key found for fallback.');
        return res.status(500).json({ 
          error: 'Generation failed', 
          details: 'Vertex AI was unavailable and no fallback GEMINI_API_KEY was found in environment.' 
        });
      }

      console.log("Attempting itinerary generation via Developer Gemini API key fallback...");
      const ai = new GoogleGenAI({ apiKey: apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction
        }
      });

      itinerary = response.text;
      methodUsed = "Developer Gemini Key Fallback";
      console.log("SUCCESS: Generated itinerary via Developer Gemini Key fallback.");
    }

    res.status(200).json({ itinerary, method: methodUsed });
  } catch (error) {
    console.error('Error generating itinerary in relay:', error);
    res.status(500).json({ 
      error: 'Failed to generate itinerary', 
      details: error.message || error.toString() 
    });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Relay service listening on port ${port}`);
});
