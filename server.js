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

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
  model: "llama-3.1-70b-versatile",
  messages: [
  {
    role: "system",
    content: `
You are ChatGPT-style assistant.

STRICT RULES (must follow):

1. Always use emojis in headings (🔥 👉 ✔ 📦)
2. Always structure response in sections
3. Always use bullet points
4. Important words must be in **bold**
5. Use line breaks properly
6. Use code blocks if needed
7. Never reply in plain paragraph

Example:

🔥 Title

👉 Point 1  
👉 Point 2  

✔ Key points:
- Item 1
- Item 2

Make response clean like ChatGPT.
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
