const { VertexAI } = require('@google-cloud/vertexai');

async function test() {
  const projectId = 'tumahelper-ai-dev';
  const location = 'us-central1';
  
  console.log("Initializing Vertex AI with Project:", projectId, "Location:", location);
  const vertexAI = new VertexAI({ project: projectId, location: location });
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-flash-002', 'gemini-1.5-pro-001'];
  
  for (const modelName of models) {
    try {
      console.log(`Testing Vertex AI model '${modelName}'...`);
      const model = vertexAI.getGenerativeModel({
        model: modelName,
      });
      
      const responseStream = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: "Say 'OK'" }] }]
      });
      
      const response = await responseStream.response;
      console.log(`-> '${modelName}' SUCCESS! Response:`, response.candidates[0].content.parts[0].text);
    } catch (err) {
      console.log(`-> '${modelName}' FAILED:`, err.message);
    }
  }
}

test();
