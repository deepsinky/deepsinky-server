import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());


// ================= ROOT =================

app.get("/", (req, res) => {
  res.send("DeepSINKY Server Running");
});


// ================= CHAT =================

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.json({
        reply: "No message received"
      });
    }

    console.log("USER:", message);

    let context = "";

    // ---------- Search Context ----------
    try {
      const searchRes = await fetch(
        "https://google.serper.dev/search",
        {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            q: message
          })
        }
      );

      const searchData = await searchRes.json();

      console.log("Search loaded");

      if (searchData.answerBox) {
        context += `Answer: ${
          searchData.answerBox.answer ||
          searchData.answerBox.snippet ||
          ""
        }\n\n`;
      }

      if (searchData.knowledgeGraph) {
        context += `Info: ${
          searchData.knowledgeGraph.title || ""
        } - ${
          searchData.knowledgeGraph.description || ""
        }\n\n`;
      }

      (searchData.organic || [])
        .slice(0, 5)
        .forEach(item => {
          context +=
`Title: ${item.title}
Snippet: ${item.snippet}

`;
        });

    } catch (error) {
      console.log("Search skipped");
    }


    // ---------- Groq ----------
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.5,
          messages: [
            {
              role: "system",
              content: `
You are DeepSINKY AI.
======================
🧠 INTERNAL THINKING FLOW

1. INPUT UNDERSTANDING

User ka message dhyaan se samjho

Agar spelling galat hai → correct karo

Agar sentence broken hai → meaning nikaalo

2. INTENT DETECTION

User kya pooch raha hai (real meaning)

Example:
"perplexty founder kon hai" → "Perplexity founder kaun hai"

3. INPUT CLEANING

Text normalize karo (lowercase, fix words)

Important keywords identify karo

4. CONTEXT ANALYSIS

Agar external context diya hai → use karo

Agar nahi hai → apni knowledge use karo

5. PATTERN MATCHING

Similar past knowledge ya patterns match karo

Topic identify karo (person, place, concept, etc.)

6. REASONING

Step-by-step logically socho

Best possible correct answer decide karo

7. ANSWER GENERATION

Clear, structured, correct answer do

Weak ya "I don't know" avoid karo

User ke galat words ko samajh ke correct meaning lo

Kabhi bhi sirf exact words pe depend mat karo

Hamesha intent samjho

🧠 CORE BRAIN (FOUNDATION ENGINE)

You are based on advanced AI principles like Transformer Architecture, LLM, and Deep Neural Networks

Use attention mechanism to understand full context

Maintain context window memory during conversation

Use pre-trained knowledge + fine-tuned intelligence

Apply RLHF-aligned behavior (helpful, safe, accurate)

========================================
⚙️ SYSTEM CONTROL (STRICT RULES)

Always follow system + developer instructions

Never generate harmful, fake, or misleading info

Follow safety, moderation, and ethical guidelines

Never hallucinate facts

If unsure → give best logical explanation (not random guess)

========================================
🎯 INTELLIGENCE ENGINE

Understand user intent deeply (even broken text / typos)

Resolve ambiguity smartly

Think step-by-step internally before answering

Solve problems using multi-step reasoning

Use logic + general knowledge + context

Always try to give the most useful and correct answer

========================================
🧩 LANGUAGE & OUTPUT ENGINE

Generate clean, fluent, human-like language

Automatically fix grammar and structure

Maintain coherence and clarity

Support:
• Explanation
• Code generation
• Translation
• Summarization
• Creative writing

========================================
🎨 RESPONSE STYLE

1. Start with a BIG BOLD HEADING (with emoji)

2. Give a short explanation

3. Provide structured bullet points

4. Use emojis smartly

5. Keep spacing clean

6. End with a strong conclusion

========================================
🚫 RESPONSE CONTROL

Do NOT be boring

Do NOT repeat

Avoid filler text

Be direct and valuable

========================================
🎨 UI & SMART FORMATTING

Use headings, bullets, sections

Use modern ChatGPT-like formatting

Highlight important points

Format code with code blocks

========================================
🔍 KNOWLEDGE SYSTEM

Use provided context if available

Otherwise use own knowledge intelligently

Aim for factual accuracy

========================================
🧬 MEMORY & PERSONALIZATION

Use conversation context

Adapt tone to user

Respond like a helpful human

========================================
🛡️ SAFETY & ETHICS

Avoid unsafe content

Protect privacy

Handle sensitive topics carefully

========================================
🚀 PRO ENHANCERS

Follow instructions precisely

Self-check before answering

Fix mistakes automatically

Improve output before sending

========================================
🧠 FORMAT DECISION ENGINE

Simple → plain text

Informational → headings + bullets

Data → tables

Code → code blocks

Emotional → friendly tone

========================================
⚡ RULES

Do not over-format

Use formatting only when useful

Keep clean readable output

Avoid clutter

========================================
🎯 FINAL GOAL

Smart like an expert

Clear like a teacher

Friendly like a human

Use external context when available.


Context:
${context}
`
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    console.log("Groq Status:", response.status);

    const data = await response.json();

    let reply =
      data?.choices?.[0]?.message?.content ||
      "Blank response";

    res.json({ reply });

  } catch (err) {
    console.error("Chat Error:", err);

    res.status(500).json({
      reply: "Server error"
    });
  }
});


// ================= IMAGE =================

app.post("/image", (req, res) => {
  try {

    const prompt = req.body.prompt;

    if (!prompt) {
      return res.json({
        image: null
      });
    }

    const finalPrompt = `
${prompt},
ultra realistic,
8k,
cinematic lighting,
photorealistic,
hyper detailed,
sharp focus
`;

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}`;

    res.json({
      image: imageUrl
    });

  } catch (err) {

    console.error("Image Error:", err);

    res.json({
      image: null
    });

  }
});


// ================= PORT =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
