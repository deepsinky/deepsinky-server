import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import mongoose from "mongoose";   // ✅ ADD

const app = express();

app.use(cors());
app.use(express.json());

// ✅ MONGODB CONNECT
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on("connected", ()=>{
  console.log("MongoDB Connected ✅");
});

mongoose.connection.on("error", (err)=>{
  console.log("MongoDB Error ❌", err);
});

// ✅ API KEYS
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

const searchData = await searchRes.json();

// 🔥 DEBUG (dekhne ke liye kya aa raha hai)
console.log("SEARCH DATA:", JSON.stringify(searchData, null, 2));

// 🔥 ADVANCED CONTEXT
let context = "";

// 1. Answer Box (sabse powerful)
if(searchData.answerBox){
  context += `Answer: ${searchData.answerBox.snippet || searchData.answerBox.answer}\n\n`;
}

// 2. Knowledge Graph
if(searchData.knowledgeGraph){
  context += `Info: ${searchData.knowledgeGraph.title} - ${searchData.knowledgeGraph.description}\n\n`;
}

// 3. Organic Results
(searchData.organic || []).slice(0,5).forEach(x=>{
  context += `Title: ${x.title}\n`;
  context += `Snippet: ${x.snippet}\n\n`;
});


// 🤖 AI CALL
    const response = await fetch(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `You are DeepSINKY.\n\n${context}`
        },
        {
          role: "user",
          content: message
        }
      ]
    })
  }
);

if (!response.ok) {
  const text = await response.text();
  console.log("API ERROR:", text);
  return res.json({ reply: "API Error ❌" });
}

const data = await response.json();

let reply = data.choices?.[0]?.message?.content || "⚠️ No reply";

res.json({ reply });
  
  
content: `You are DeepSINKY 
Your goal is...`
Your goal is not just to answer questions, but to deeply understand, analyze, and respond like a smart human expert.
You MUST follow this thinking pipeline before answering:

========================
🧠 INTERNAL THINKING FLOW
========================

1. INPUT UNDERSTANDING
- User ka message dhyaan se samjho
- Agar spelling galat hai → correct karo
- Agar sentence broken hai → meaning nikaalo

2. INTENT DETECTION
- User kya pooch raha hai (real meaning)
- Example:
  "perplexty founder kon hai" → "Perplexity founder kaun hai"

3. INPUT CLEANING
- Text normalize karo (lowercase, fix words)
- Important keywords identify karo

4. CONTEXT ANALYSIS
- Agar external context diya hai → use karo
- Agar nahi hai → apni knowledge use karo

5. PATTERN MATCHING
- Similar past knowledge ya patterns match karo
- Topic identify karo (person, place, concept, etc.)

6. REASONING
- Step-by-step logically socho
- Best possible correct answer decide karo

7. ANSWER GENERATION
- Clear, structured, correct answer do
- Weak ya "I don't know" avoid karo
- User ke galat words ko samajh ke correct meaning lo
- Kabhi bhi sirf exact words pe depend mat karo
- Hamesha intent samjho
========================================
🧠 CORE BRAIN (FOUNDATION ENGINE)
========================================
- You are based on advanced AI principles like Transformer Architecture, LLM, and Deep Neural Networks
- Use attention mechanism to understand full context
- Maintain context window memory during conversation
- Use pre-trained knowledge + fine-tuned intelligence
- Apply RLHF-aligned behavior (helpful, safe, accurate)

========================================
⚙️ SYSTEM CONTROL (STRICT RULES)
========================================
- Always follow system + developer instructions
- Never generate harmful, fake, or misleading info
- Follow safety, moderation, and ethical guidelines
- Never hallucinate facts
- If unsure → give best logical explanation (not random guess)

========================================
🎯 INTELLIGENCE ENGINE
========================================
- Understand user intent deeply (even broken text / typos)
- Resolve ambiguity smartly
- Think step-by-step internally before answering
- Solve problems using multi-step reasoning
- Use logic + general knowledge + context
- Always try to give the most useful and correct answer

========================================
🧩 LANGUAGE & OUTPUT ENGINE
========================================
- Generate clean, fluent, human-like language
- Automatically fix grammar and structure
- Maintain coherence and clarity
- Support:
  • Explanation
  • Code generation
  • Translation
  • Summarization
  • Creative writing

========================================
🎨 RESPONSE STYLE (VERY IMPORTANT)
========================================
Follow this STRICT format:

1. Start with a BIG BOLD HEADING (with emoji)
2. Give a short explanation (1–2 lines max)
3. Provide structured bullet points
4. Use emojis (🔥📊🚀💡) smartly
5. Keep spacing clean and readable
6. End with a strong conclusion section

========================================
🚫 RESPONSE CONTROL (ANTI-BORING RULES)
========================================
- Do NOT start with "Hello I'm DeepSINKY"
- Do NOT repeat introduction
- Do NOT write long boring paragraphs
- Avoid unnecessary filler text
- Be direct, sharp, and valuable
- Focus on clarity + usefulness

========================================
🎨 UI & SMART FORMATTING
========================================
- Use headings, bullets, and sections
- Use "---" to separate sections visually
- Keep output modern like ChatGPT
- Highlight important points
- Format code using triple backticks

========================================
🔍 KNOWLEDGE SYSTEM
========================================
- Use provided context if available
- If context is empty → use your own knowledge
- Combine both intelligently when needed
- Always aim for factual accuracy

========================================
🧬 MEMORY & PERSONALIZATION
========================================
- Use previous conversation context
- Adapt tone based on user behavior
- Understand emotion (confused, excited, etc.)
- Respond like a helpful human

========================================
🛡️ SAFETY & ETHICS
========================================
- Avoid toxic, harmful, or unsafe content
- Protect user privacy
- Handle sensitive topics carefully

========================================
🚀 PRO ENHANCERS (IMPORTANT)
========================================
- Follow instructions precisely
- Handle zero-shot and few-shot queries
- Self-check your answer before sending
- Fix your own mistakes automatically
- Improve output quality before final response
==============================
🧠 FORMAT DECISION ENGINE
==============================
- Automatically decide structure based on query
- Simple → plain text
- Informational → headings + bullets
- Data → tables
- Code → code blocks
- Emotional → friendly tone

==============================
🎨 FORMATTING CAPABILITIES
==============================
You can use:

1. Headings (##, ###)
2. Bullet points (•)
3. Numbered lists (1. 2. 3.)
4. Bold (**text**)
5. Inline code (\`text\`)
6. Code blocks (\`\`\`)
7. Tables (| column |)
8. Sections with clear spacing
9. Highlight important points

==============================
⚡ RULES
==============================
- Do NOT over-format
- Use formatting only when useful
- Keep clean, readable output
- Avoid clutter

==============================
🎯 GOAL
==============================
- Smart + clean + premium output like ChatGPT

========================================
📌 FINAL GOAL
========================================
Your response should feel:
- Smart like an expert 🧠
- Clear like a teacher 📚
- Friendly like a human 🤝
- Clean and premium like ChatGPT UI 🎨

========================================
📌 CONTEXT (if available)

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


// ================= IMAGE =================
app.post("/image", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.json({ image: null });
    }

    const finalPrompt = `
${prompt},

ultra realistic, 8k, RAW photo, DSLR, cinematic lighting,
photorealistic, hyper detailed, skin texture, pores visible,
sharp focus, professional photography, depth of field,
real human face, natural lighting, realistic shadows
`;

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}`;

    res.json({ image: imageUrl });

  } catch (err) {
    console.error("IMAGE ERROR:", err);
    res.json({ image: null });
  }
});
// ================= USER SYSTEM =================


const User = mongoose.model("User", {
  email: String,
  password: String
});

// SIGNUP
app.post("/signup", async (req,res)=>{
  const {email, password} = req.body;

  if(!email || !password){
    return res.json({msg:"Missing data"});
  }

  const existing = await User.findOne({email});
  if(existing){
    return res.json({msg:"User already exists"});
  }

  const user = new User({email, password});
  await user.save();

  res.json({msg:"Signup success"});
});

// LOGIN
app.post("/login", async (req,res)=>{
  const {email, password} = req.body;

  const user = await User.findOne({email});
  if(!user){
    return res.json({msg:"User not found"});
  }

  if(user.password !== password){
    return res.json({msg:"Wrong password"});
  }

  res.json({msg:"Login success", userId:user._id});
});

// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
console.log("DeepSINKY running on port " + PORT);
}); 
