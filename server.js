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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    let reply = data?.choices?.[0]?.message?.content || "No response";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Server error 😢" });
  }
});

// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
