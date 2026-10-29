// auth.js — DeepSINKY login routes (Express, ES modules). Put next to your server file.
// Provides: POST /auth/check, /auth/signup, /auth/login, /auth/google  and  GET /auth/me
import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();
router.use(express.json({ limit: "20kb" }));

const GID = process.env.GOOGLE_CLIENT_ID || "194612760175-ffbcfq6fmpqqnbq30d6ll26jpnib1e4o.apps.googleusercontent.com";
const SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.AUTH_SECRET) console.warn("[auth] AUTH_SECRET is not set: everyone is logged out on every restart.");
const FILE = process.env.USERS_FILE || path.join(__dirname, "users.json");
const TOKEN_DAYS = 30;

/* ---- tiny JSON "database" (see note: Render free disk is wiped on redeploy) ---- */
let users = {};
try { users = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) {}
function save() {
  try { fs.writeFileSync(FILE + ".tmp", JSON.stringify(users)); fs.renameSync(FILE + ".tmp", FILE); }
  catch (e) { console.error("[auth] could not save users:", e.message); }
}

/* ---- passwords + tokens (Node built-ins only, no extra packages) ---- */
function hashPw(pw) {
  const salt = crypto.randomBytes(16);
  return salt.toString("hex") + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
}
function checkPw(pw, stored) {
  try {
    const [s, h] = stored.split(":");
    const a = crypto.scryptSync(pw, Buffer.from(s, "hex"), 64), b = Buffer.from(h, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { return false; }
}
const b64 = (s) => Buffer.from(s).toString("base64url");
function makeToken(email) {
  const body = b64(JSON.stringify({ e: email, x: Date.now() + TOKEN_DAYS * 864e5 }));
  return body + "." + crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
}
function readToken(tok) {
  try {
    const [body, sig] = String(tok).split(".");
    const good = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
    if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.x > Date.now() ? p.e : null;
  } catch (e) { return null; }
}

/* ---- helpers ---- */
const clean = (e) => String(e || "").trim().toLowerCase();
const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length < 255;
const pub = (u) => ({ email: u.email, name: u.name });
const session = (u) => ({ token: makeToken(u.email), user: pub(u) });

const hits = new Map(); // very small brute-force guard: 15 tries / 15 min / IP
function limited(req) {
  const k = req.ip, now = Date.now(), a = (hits.get(k) || []).filter((t) => now - t < 9e5);
  a.push(now); hits.set(k, a); return a.length > 15;
}

/* ---- routes ---- */
router.post("/check", (req, res) => {
  const email = clean(req.body.email);
  if (!okEmail(email)) return res.status(400).json({ error: "Enter a valid email address" });
  const u = users[email];
  res.json({ exists: !!u, hasPassword: !!(u && u.hash) });
});

router.post("/signup", (req, res) => {
  if (limited(req)) return res.status(429).json({ error: "Too many attempts. Try again later." });
  const email = clean(req.body.email), name = String(req.body.name || "").trim().slice(0, 80), pw = String(req.body.password || "");
  if (!okEmail(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (!name) return res.status(400).json({ error: "Enter your name" });
  if (pw.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  if (users[email]) return res.status(409).json({ error: "An account with this email already exists" });
  users[email] = { email, name, hash: hashPw(pw), created: Date.now() };
  save();
  res.json(session(users[email]));
});

router.post("/login", (req, res) => {
  if (limited(req)) return res.status(429).json({ error: "Too many attempts. Try again later." });
  const email = clean(req.body.email), u = users[email];
  if (!u || !u.hash || !checkPw(String(req.body.password || ""), u.hash))
    return res.status(401).json({ error: "Incorrect email or password" });
  res.json(session(u));
});

router.post("/google", async (req, res) => {
  try {
    const at = String(req.body.access_token || "");
    if (!at) return res.status(400).json({ error: "Missing Google token" });
    const ti = await (await fetch("https://oauth2.googleapis.com/tokeninfo?access_token=" + encodeURIComponent(at))).json();
    if (!ti || (ti.aud !== GID && ti.azp !== GID)) return res.status(401).json({ error: "Google token was not issued for this app" });
    const g = await (await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: "Bearer " + at } })).json();
    const email = clean(g.email);
    if (!okEmail(email) || g.email_verified === false) return res.status(401).json({ error: "Google account email is not verified" });
    let u = users[email];
    if (!u) u = users[email] = { email, name: g.name || email.split("@")[0], google: true, created: Date.now() };
    else if (!u.google) u.google = true;
    save();
    res.json(session(u));
  } catch (e) {
    console.error("[auth] google error:", e.message);
    res.status(500).json({ error: "Google sign-in failed. Please try again." });
  }
});

router.get("/me", (req, res) => {
  const email = readToken((req.headers.authorization || "").replace(/^Bearer\s+/i, ""));
  const u = email && users[email];
  if (!u) return res.status(401).json({ error: "Not signed in" });
  res.json({ user: pub(u) });
});

export default router;
