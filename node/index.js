import WebSocket from "ws";

const API_KEY = process.env.API_KEY;
const WS_URL = process.env.WS_URL;

if (!API_KEY || !WS_URL) {
  console.error("set API_KEY and WS_URL env vars");
  process.exit(1);
}

const seen = new Set(); // dedupe tweet ids across event stages

function connect() {
  const ws = new WebSocket(WS_URL, { headers: { "X-Api-Key": API_KEY } });

  ws.on("open", () => console.log("connected"));

  ws.on("message", (raw) => {
    let e;
    try { e = JSON.parse(raw.toString()); } catch { return; }
    if (e.platform !== "x" || !String(e.eventType || "").startsWith("tweet")) return;
    if (e.id && seen.has(e.id)) return;
    if (e.id) seen.add(e.id);
    console.log(`[${e.timestamp}] @${e.handle}: ${e.content ?? ""}`);
    // -> your logic here: match tickers / contract addresses / keywords
  });

  ws.on("close", () => {
    console.log("disconnected, reconnecting in 1s");
    setTimeout(connect, 1000);
  });
  ws.on("error", (err) => console.error("ws error:", err.message));
}

connect();
