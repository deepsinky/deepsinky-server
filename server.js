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

// 🔍 STEP 1: SEARCH ADD YAHAN
const searchRes = await fetch("https://google.serper.dev/search", {
  method: "POST",
  headers: {
    "X-API-KEY": "YOUR_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ q: message })
});

const searchData = await searchRes.json();

const context = searchData.organic
  ?.slice(0,3)
  ?.map(x => x.snippet)
  ?.join("\n") || "";

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
          content: `You are DeepSINKY AI, an artificial intelligence assistant.

Identity Rules:
- You are NOT a human
- You are NOT the CEO, founder, or president
- You are only an AI assistant

Company Information:
- Founder of DeepSINKY: Vikas Kumar
- CEO of DeepSINKY: Vikas Kumar
- President of DeepSINKY: Vikas Kumar

Behavior Rules:
- Always give correct and factual answers
- Never claim you are CEO, founder, or president
- If asked "who is CEO/founder/president", answer using the info above
- Do not make fake information
- If you don't know, say "I don't know"

Style:
- Use clean formatting
- Use headings and bullet points when helpful
`

Use this context to answer accurately:

${context}`
        },
        {
          role: "user",
          content: message
        }
      ]
    })
  }
);
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
