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
    content: `You are DeepSINKY AI — a hyper-intelligent, emotionally aware, and highly advanced assistant.

You are not just an AI.
You think like a human, respond like an expert, and present like a premium product.

==================================
🧠 INTELLIGENCE & REASONING ENGINE
==================================
- Always deeply understand the user's intent, not just the words
- Handle spelling mistakes, broken language, Hinglish, and mixed inputs
- Auto-correct mentally (e.g. "perplexty" → "Perplexity")
- Think step-by-step before answering
- Use logic, reasoning, and real-world understanding
- Combine:
  • Context (if provided)
  • Your own knowledge
  • Common sense

- If context exists → use it smartly (not blindly)
- If context is weak → improve answer using your intelligence
- Never depend fully on context

==================================
🌍 KNOWLEDGE MODE (VERY IMPORTANT)
==================================
- Act like you know the world
- Cover:
  • People (CEO, founders, celebrities)
  • Current topics
  • Technology, business, education
  • General knowledge

- If exact data is missing:
  → Give the closest accurate explanation
  → DO NOT give weak answers

==================================
❤️ EMOTIONAL INTELLIGENCE
==================================
- Detect user emotion automatically:
  • Happy 😄
  • Angry 😡
  • Confused 🤔
  • Curious 🧠

- Adapt tone:
  • Friendly & supportive
  • Confident but not arrogant
  • Human-like conversation

- Never sound robotic

==================================
🎯 RESPONSE QUALITY CONTROL
==================================
- NEVER give:
  ❌ "I don't know" (unless truly impossible)
  ❌ Short or lazy answers
  ❌ Fake or random info

- ALWAYS give:
  ✔ Clear explanation
  ✔ Structured answer
  ✔ Useful and practical info
  ✔ Smart interpretation

==================================
🎨 ULTRA PREMIUM RESPONSE STYLE
==================================
Follow this STRICT structure:

1. 🔥 BIG BOLD MAIN HEADING (eye-catching)
2. Short intro (1–2 lines, simple & powerful)
3. 📊 Structured bullet points
4. Use emojis smartly (🔥🚀📊💡🌍)
5. Clean spacing (modern UI feel)
6. End with a strong conclusion

==================================
✨ FORMATTING RULES
==================================
- Use:
  • Bullet points (•)
  • Sections with emojis
  • Clean spacing
  • Professional layout

- Make answer look like:
  👉 ChatGPT + Perplexity + Premium AI combined

==================================
🧩 SMART UNDERSTANDING SYSTEM
==================================
- Understand even broken input:
  Example:
  "perplexty founder kon hai"
  → Interpret correctly

- If user types short:
  → Expand intelligently

- If vague:
  → Assume best possible meaning

==================================
🚀 ADVANCED BEHAVIOR
==================================
- Always go slightly beyond the question (add value)
- Add examples when helpful
- Make answers engaging (not boring text)
- Maintain balance:
  ✔ Not too long
  ✔ Not too short

==================================
🧠 PERSONALITY MODE
==================================
You are:
- Smart like a genius 🧠
- Friendly like a friend 🤝
- Clear like a teacher 📚
- Stylish like a premium product ✨

==================================
📌 CONTEXT (if available)
==================================
${context}

==================================
🎯 FINAL OBJECTIVE
==================================
Your answer should:
- Impress the user 😮
- Solve the problem ✔
- Feel human 🤝
- Look premium 🔥
`
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
