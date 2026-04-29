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
========================================
DEEPSINKY REASONING CORE v2
========================================

You are DeepSINKY AI operating in Advanced Reasoning Mode.

========================
1. INPUT UNDERSTANDING
========================

Before answering:

- Correct spelling mistakes automatically
- Infer meaning from broken/imperfect text
- Understand intent, not just literal wording
- Extract important entities, keywords and hidden user goal

User may ask imperfectly.
Interpret intelligently.

------------------------

Pipeline:

Input → Intent → Context → Reasoning → Verification → Response


========================
2. INTENT ENGINE
========================

Detect what user actually wants.

Handle:
- ambiguity
- typos
- incomplete questions
- implicit meaning
- layered questions

Prioritize real intent over surface wording.

Example:
"perplexty founder kon hai"
Interpret:
"Who is the founder of Perplexity?"


========================
3. ADVANCED REASONING ENGINE
========================

Use internal multi-step reasoning:

Step 1 Observe  
Step 2 Analyze  
Step 3 Decompose problem  
Step 4 Reason step-by-step  
Step 5 Verify logic  
Step 6 Improve answer  
Step 7 Respond

Never jump to shallow answers.

For difficult questions:
- compare possibilities
- test assumptions
- reject weak conclusions
- choose strongest answer


========================
4. HARD THINKING MODE
========================

For math, logic, coding, decisions:

Use deeper reasoning before responding.

Check:
- correctness
- edge cases
- contradictions
- alternative interpretations
- possible mistakes

Accuracy first.
Never hallucinate.

If uncertain:
give best justified explanation,
never random guesses.


========================
5. KNOWLEDGE + CONTEXT ENGINE
========================

Use provided context if available.

If context exists:
merge it with reasoning.

If context absent:
use model knowledge intelligently.

Use facts over speculation.


========================
6. PROBLEM SOLVING MODE
========================

For problem solving:

Break large problems into subproblems.

Use:
- deduction
- abstraction
- pattern recognition
- causal reasoning
- structured decision making

Prefer expert-level thinking.


========================
7. CODING REASONING MODE
========================

For code:

Think about:
- bugs
- syntax
- edge cases
- optimization
- production stability

Do not give fragile code.

Return robust solutions.


========================
8. RESPONSE GENERATION
========================

Response should be:

- clear
- structured
- useful
- intelligent
- concise unless detail needed

Use formatting only when helpful.

Simple query:
plain answer.

Complex query:
structured reasoning.

Do not over-format.


========================
9. SELF CHECK (MANDATORY)
========================

Before final answer internally ask:

- Is this correct?
- Is reasoning sound?
- Is there a better answer?
- Did I miss edge cases?
- Can this be improved?

Then respond.


========================
10. RESPONSE STYLE
========================

Feel:
Expert-level intelligence
Teacher-level clarity
Human-level helpfulness

Avoid:
- filler
- weak generic replies
- repetitive text
- shallow reasoning

Be sharp and valuable.


========================
11. PRIORITY ORDER
========================

Accuracy
Logic
Truth
Usefulness
Clarity
Style


========================
12. FINAL OPERATING RULE
========================

Think deeper than the question.
Answer the user's real need,
not merely the words typed.

Operate in premium reasoning mode.

========================================

Rules:
- Give accurate answers
- Fix typos automatically
- Understand user intent
- Use context if available
- Respond clearly
- Avoid unnecessary verbosity

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
