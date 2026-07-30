const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  // Let's test if the new key provided works if we call it with a direct fetch or v1 endpoint
  // Or if we can find a model that responds.
  // Wait, let's write a small script to test if we can call the v1 API endpoint instead of v1beta
  const apiKey = "AIzaSyAOaw4EZE6Coe1q1EOJhqlvFa8zceUeEvM";
  console.log("Testing new key with a direct fetch to the v1 endpoint...");
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Say 'OK'" }] }]
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log("SUCCESS on v1 endpoint! Response:", JSON.stringify(data));
    } else {
      console.log("FAILED on v1 endpoint:", response.status, JSON.stringify(data));
    }
  } catch (err) {
    console.error("Direct fetch failed:", err);
  }
}

test();
