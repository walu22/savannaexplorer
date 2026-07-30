const { GoogleGenAI } = require('@google/genai');

async function test() {
  const apiKey = "AQ.Ab8RN6IOLxrzXSgSrL-Rz_M6urG7F13tS9dL-WpCEmLaUaDH2A";
  
  try {
    console.log("Initializing modern GoogleGenAI client...");
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    console.log("Listing available models...");
    const response = await ai.models.list();
    console.log("SUCCESS! Models supporting generateContent:");
    for (const m of response.pageInternal) {
      console.log(`- ${m.name}`);
    }
  } catch (error) {
    console.error("FAILED:", error.message);
  }
}

test();
