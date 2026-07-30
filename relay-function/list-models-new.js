const { GoogleGenerativeAI } = require('@google/generative-ai');

async function list() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No GOOGLE_API_KEY found.");
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTest = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro",
      "gemini-pro",
      "gemini-1.0-pro"
    ];
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing model '${modelName}'...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'OK'");
        console.log(`-> '${modelName}' works! Response:`, result.response.text().trim());
      } catch (err) {
        console.log(`-> '${modelName}' FAILED:`, err.message);
      }
    }
  } catch (error) {
    console.error("Listing failed:", error);
  }
}

list();
