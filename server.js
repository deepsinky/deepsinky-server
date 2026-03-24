import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;

console.log("API KEY CHECK:", API_KEY ? "OK" : "MISSING");

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

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
         model: "mistralai/mistral-7b-instruct",
          messages: [
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    let reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      if (data?.error) {
        reply = "API Error: " + data.error.message;
      } else {
        reply = "⚠️ No response from AI";
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

app.listen(PORT, () => {
  console.log("DeepSINKY running on port " + PORT);
});
