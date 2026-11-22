// Minimal 1322 X (Twitter) WebSocket client: prints each new tweet once.
// Docs: https://1322.io/docs/x
import WebSocket from "ws";

// Normal plans. X Ultimate's selected accounts use
// wss://ws.ultimate.1322.io/ws/ultimate with the ultimate key.
const WS_URL = process.env.WS_URL || "wss://ws.normal.1322.io/ws/normal";
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("set API_KEY (your 1322 X API key); WS_URL defaults to the normal stream");
  process.exit(1);
}

// A tweet arrives in stages that share one tweet.id: tweet.mini.update comes
// first, then tweet.update / tweet.update.expanded / tweet.full when the tweet
// has more to add (cards, quoted chains, untruncated text).
const TWEET_STAGES = new Set(["tweet.mini.update", "tweet.update", "tweet.update.expanded", "tweet.full"]);

const seen = new Set(); // tweet ids already printed (insertion order, capped below)

function onEvent(event) {
  const tweet = event.tweet ?? {};
  const handle = tweet.author?.handle ?? "?";
  if (event.type === "tweet.deleted") {
    console.log(`deleted: @${handle} ${tweet.id}`);
    return;
  }
  if (!TWEET_STAGES.has(event.type) || !tweet.id) return; // profile.update, following.update, pinned-tweet changes
  if (seen.has(tweet.id)) return; // a later stage of a tweet already printed
  seen.add(tweet.id);
  if (seen.size > 10000) seen.delete(seen.values().next().value);
  const at = Number.isFinite(tweet.created_at) ? new Date(tweet.created_at).toISOString() : "?"; // Unix ms
  console.log(`[${at}] ${tweet.type ?? "TWEET"} @${handle}: ${tweet.body?.text ?? ""}`);
  // -> your logic here: match tickers / contract addresses / keywords
}

let backoff = 1000;

function connect() {
  // The server pings; the ws library answers automatically.
  const ws = new WebSocket(WS_URL, { headers: { "X-API-Key": API_KEY } });

  ws.on("open", () => {
    backoff = 1000;
    console.log("connected");
  });

  ws.on("message", (raw) => {
    let event;
    try { event = JSON.parse(raw.toString()); } catch { return; }
    if (event && typeof event === "object" && !Array.isArray(event)) onEvent(event);
  });

  ws.on("error", (err) => console.error("ws error:", err.message));

  // Events are not queued while you are disconnected: reconnect with a capped backoff.
  ws.on("close", () => {
    console.log(`disconnected, reconnecting in ${backoff / 1000}s`);
    setTimeout(connect, backoff);
    backoff = Math.min(backoff * 2, 30000);
  });
}

connect();
