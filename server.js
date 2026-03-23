import express from "express";
import cors from "cors";

const app = express(); // ✅ YE LINE MUST HAI

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("DeepSINKY Server Running ✅");
});

// ✅ CHAT
app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content || "No response 😢";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Server error 😢" });
  }
});

// ✅ PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("DeepSINKY running on port " + PORT);
});
