const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No GOOGLE_API_KEY found in env.");
    return;
  }
  console.log("Testing with API Key prefix:", apiKey.substring(0, 10));
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, write a 1-sentence welcome greeting for savanna explorer.");
    console.log("SUCCESS!");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("FAILED to generate content:", error);
  }
}

test();
