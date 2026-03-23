import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;
console.log("API KEY CHECK:", API_KEY ? "OK" : "MISSING");
console.log("API KEY VALUE:", API_KEY);

// ROOT
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// CHAT
app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.json({ reply: "No message ❌" });
    }

    console.log("USER MESSAGE:", message);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://deepsinky.github.io",
          "X-Title": "DeepSINKY"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
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

    // ✅ FIXED LINE
    let reply = data?.choices?.[0]?.message?.content || "";

    if (!reply) {
      if (data?.error) {
        reply = "API Error: " + data.error.message;
      } else {
        reply = "⚠️ Empty response from AI";
      }
    }

    res.json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ reply: "Server error 😢" });
  }
});

// LISTEN
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("DeepSINKY AI server running on port " + PORT);
});
