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
