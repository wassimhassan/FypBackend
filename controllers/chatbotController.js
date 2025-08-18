// controllers/chatbotController.js
// CommonJS controller. Uses OpenRouter if OPENROUTER_API_KEY is set; otherwise echoes.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

exports.chatWithAI = async (req, res, next) => {
  try {
    const { model = "openrouter/auto", messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "messages array required" });
    }

    // If you have an OpenRouter key, call it; else fall back to echo
    if (process.env.OPENROUTER_API_KEY) {
      const r = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3001",
          "X-Title": "Fekra AI Assistant",
        },
        body: JSON.stringify({ model, messages }),
      });

      const data = await r.json();
      if (!r.ok) {
        // Surface provider error to client so your UI shows details
        return res.status(r.status).json(data);
      }
      // Return in OpenAI/OpenRouter-like shape (your frontend parser expects this)
      return res.json(data);
    }

    // Fallback: simple echo so you can test end-to-end without a key
    const last = messages[messages.length - 1]?.content ?? "";
    return res.json({ choices: [{ message: { content: `Echo: ${last}` } }] });
  } catch (err) {
    next(err);
  }
};
