/* ============================================================
   DeepSINKY server: /image endpoint  (FREE option + paid GPT Image 2 option)
   Paste into your Render server file (where app.post("/chat", ...) is),
   AFTER `app.use(express.json(...))` and `app.use(cors(...))`. Needs Node 18+.

   FREE  (Cloudflare Workers AI, FLUX.1 schnell) - set in Render -> Environment:
       CF_ACCOUNT_ID = your Cloudflare account id
       CF_API_TOKEN  = API token with "Workers AI" permission
   PAID  (GPT Image 2) - optional; if this is set it is used first:
       OPENAI_API_KEY = sk-...      IMAGE_QUALITY = low | medium | high
   If neither is set, the app automatically uses its built-in free Flux (Pollinations).
   ============================================================ */
const _imgHits = new Map();                       // per-IP limiter so nobody burns your quota
function _imgLimited(ip) {
  const now = Date.now(), win = 3600e3, max = Number(process.env.IMAGE_PER_HOUR || 15);
  const arr = (_imgHits.get(ip) || []).filter(t => now - t < win);
  if (arr.length >= max) { _imgHits.set(ip, arr); return true; }
  arr.push(now); _imgHits.set(ip, arr); return false;
}
const _cf = (path, body) => fetch(
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${path}`,
  { method: "POST", headers: { Authorization: "Bearer " + process.env.CF_API_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });

async function _cfEnglishPrompt(raw) {            // Flux understands English best; translate/enrich Hindi/Hinglish
  try {
    const r = await _cf("@cf/meta/llama-3.1-8b-instruct", { messages: [
      { role: "system", content: "Rewrite the user's request as ONE detailed English image-generation prompt (40-70 words): subject, style, composition, lighting, colors, mood, ultra detailed. Keep any text that must appear in the image exact. Output only the prompt." },
      { role: "user", content: raw }] });
    const j = await r.json();
    const t = String((j.result && j.result.response) || "").replace(/\s+/g, " ").trim();
    return t.length > 15 && t.length < 1500 ? t : raw;
  } catch (e) { return raw; }
}

app.post("/image", async (req, res) => {
  try {
    const hasOpenAI = !!process.env.OPENAI_API_KEY, hasCF = !!(process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN);
    if (!hasOpenAI && !hasCF) return res.status(501).json({ error: "no image provider configured" });
    const ip = String(req.headers["x-forwarded-for"] || req.ip || "x").split(",")[0].trim();
    if (_imgLimited(ip)) return res.status(429).json({ error: "Too many images, try again later" });
    const { prompt, size } = req.body || {};
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "prompt required" });

    if (hasOpenAI) {                                                    // ---- GPT Image 2 (paid)
      const okSizes = ["1024x1024", "1536x1024", "1024x1536"];
      const body = { model: process.env.IMAGE_MODEL || "gpt-image-2", prompt: prompt.slice(0, 4000),
        size: okSizes.includes(size) ? size : "1024x1024", quality: process.env.IMAGE_QUALITY || "medium", n: 1 };
      const call = b => fetch("https://api.openai.com/v1/images/generations", { method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENAI_API_KEY },
        body: JSON.stringify(b), signal: AbortSignal.timeout(140000) });
      let r = await call(body);
      if (r.status === 400) { const { quality, ...lean } = body; r = await call(lean); }
      const j = await r.json().catch(() => ({}));
      const d = r.ok && j.data && j.data[0];
      if (d) return res.json({ engine: "GPT Image 2", image: d.b64_json ? "data:image/png;base64," + d.b64_json : d.url });
      console.error("openai image error", r.status, JSON.stringify(j).slice(0, 300));
      if (!hasCF) return res.status(502).json({ error: "image generation failed" });   // else fall through to free
    }

    const en = await _cfEnglishPrompt(prompt.slice(0, 1500));           // ---- Cloudflare FLUX.1 schnell (free)
    const r = await _cf("@cf/black-forest-labs/flux-1-schnell", { prompt: en.slice(0, 2000), steps: 6 });
    const j = await r.json().catch(() => ({}));
    const b64 = j.result && j.result.image;
    if (!r.ok || !b64) { console.error("cf image error", r.status, JSON.stringify(j).slice(0, 300)); return res.status(502).json({ error: "image generation failed" }); }
    return res.json({ engine: "Flux (Cloudflare)", image: "data:image/jpeg;base64," + b64 });
  } catch (e) {
    console.error("image exception", e);
    return res.status(500).json({ error: "image server error" });
  }
});
