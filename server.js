import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;

// ROOT
app.get("/", (req, res) => {
res.send("DeepSINKY Server is running ✅");
});

// CHAT
app.post("/chat", async (req, res) => {
try {
const message = req.body.message;

if (!message) {
  return res.json({ reply: "No message ❌" });
}

console.log("USER:", message);
// 1. Google search
const searchRes = await fetch("https://google.serper.dev/search", {
  method: "POST",
  headers: {
    "X-API-KEY": process.env.SERPER_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ q: message })
});

// 2. Context banana
const searchData = await searchRes.json();

// ✅ pehle log karo
console.log("SEARCH DATA:", JSON.stringify(searchData, null, 2));

// ✅ phir context banao
const context = (searchData.organic || [])
  .slice(0, 5)
  .map(x => `${x.title}: ${x.snippet}`)
  .join("\n");

// 🤖 STEP 2: AB AI CALL
const response = await fetch(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      
messages: [
  {
    role: "system",
    content: `You are DeepSINKY AI.

Rules:
- Use context if available, otherwise use your own knowledge
- Never give empty or weak answers
- Always give full detailed answers

Response Style (VERY IMPORTANT):

1. Start with a BIG BOLD HEADING
2. Then give a short 1–2 line explanation
3. Then give structured bullet points
4. Use emojis to make it attractive
5. End with a conclusion section

Formatting Rules:
- Heading must be bold and eye-catching
- Use emojis like 🔥📊🌡️🚀
- Use clean spacing
- Make it look modern and professional like ChatGPT

Example Structure:

**🔥 Topic Name (Main Heading)**

Short explanation here...

📊 Key Points:
• Point 1  
• Point 2  
• Point 3  

🚀 Conclusion:
Final summary here...

Context:
${context}`
  },
  {
    role: "user",
    content: message
      }
    ]
  })
});
console.log("STATUS:", response.status);  

const data = await response.json();  
console.log("FULL DATA:", JSON.stringify(data, null, 2));  

let reply = "";  

if (data.choices && data.choices.length > 0) {  
  reply = data.choices[0].message?.content || "";  
}  

if (!reply) {  
  if (data.error) {  
    reply = "API Error: " + data.error.message;  
  } else {  
    reply = "⚠️ AI ne blank response diya";  
  }  
}  

res.json({ reply });

} catch (err) {
console.error("SERVER ERROR:", err);
res.status(500).json({ reply: "Server error 😢" });
}
});

// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
console.log("DeepSINKY running on port " + PORT);
}); 
