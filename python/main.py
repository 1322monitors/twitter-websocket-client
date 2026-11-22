"""Minimal 1322 X (Twitter) WebSocket client: prints each new tweet once.

Docs: https://1322.io/docs/x
"""
import asyncio
import json
import os
from datetime import datetime, timezone

from websockets.asyncio.client import connect

# Normal plans. X Ultimate's selected accounts use
# wss://ws.ultimate.1322.io/ws/ultimate with the ultimate key.
WS_URL = os.environ.get("WS_URL") or "wss://ws.normal.1322.io/ws/normal"
API_KEY = os.environ.get("API_KEY")

# A tweet arrives in stages that share one tweet.id: tweet.mini.update comes
# first, then tweet.update / tweet.update.expanded / tweet.full when the tweet
# has more to add (cards, quoted chains, untruncated text).
TWEET_STAGES = {"tweet.mini.update", "tweet.update", "tweet.update.expanded", "tweet.full"}

seen = {}  # tweet ids already printed (insertion order, capped below)


def on_event(event):
    kind = event.get("type")
    tweet = event.get("tweet") or {}
    tweet_id = tweet.get("id")
    handle = (tweet.get("author") or {}).get("handle") or "?"
    if kind == "tweet.deleted":
        print(f"deleted: @{handle} {tweet_id}")
        return
    if kind not in TWEET_STAGES or not tweet_id:
        return  # profile.update, following.update, pinned-tweet changes
    if tweet_id in seen:
        return  # a later stage of a tweet already printed
    seen[tweet_id] = True
    if len(seen) > 10_000:
        del seen[next(iter(seen))]
    ms = tweet.get("created_at")  # Unix milliseconds
    at = datetime.fromtimestamp(ms / 1000, timezone.utc).isoformat() if isinstance(ms, (int, float)) else "?"
    text = (tweet.get("body") or {}).get("text") or ""
    print(f"[{at}] {tweet.get('type') or 'TWEET'} @{handle}: {text}")
    # -> your logic here


async def run():
    if not API_KEY:
        raise SystemExit("set API_KEY (your 1322 X API key); WS_URL defaults to the normal stream")

    backoff = 1
    while True:
        try:
            # The server pings; the websockets library answers automatically.
            async with connect(WS_URL, additional_headers={"X-API-Key": API_KEY}) as ws:
                print("connected")
                backoff = 1
                async for raw in ws:
                    try:
                        event = json.loads(raw)
                    except ValueError:
                        continue
                    if isinstance(event, dict):
                        on_event(event)
        except Exception as exc:  # noqa: BLE001
            print(f"disconnected ({exc})")
        # Events are not queued while you are disconnected: reconnect with a capped backoff.
        print(f"reconnecting in {backoff}s")
        await asyncio.sleep(backoff)
        backoff = min(backoff * 2, 30)


if __name__ == "__main__":
    asyncio.run(run())
