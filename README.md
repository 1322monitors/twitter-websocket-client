# twitter-websocket-client

Minimal real-time Twitter/X client over WebSocket, in Node and Python: connect to the 1322 X stream with your API key and print each new tweet from the accounts on your tracked list, typically 150-250ms after it is posted. It is a Twitter streaming API alternative for people who need a real-time Twitter API for specific accounts without an X developer account. Maintained by the 1322 team; the consumer pattern is generic.

- X quick start: https://1322.io/docs/x
- Full event reference: https://1322.io/docs
- Platform page: https://1322.io/platforms/x
- Piping tracked tweets into a Discord channel: https://1322.io/blog/twitter-to-discord-bot

## Your key and stream

Copy your API key from the API access page in your dashboard. Each X stream has its own key:

| Stream | WebSocket URL | Key |
|---|---|---|
| Normal | `wss://ws.normal.1322.io/ws/normal` | your normal key |
| X Ultimate (selected accounts) | `wss://ws.ultimate.1322.io/ws/ultimate` | your ultimate key |

The client sends the key as the `X-API-Key` header on the WebSocket handshake. `WS_URL` defaults to the normal stream. On X Ultimate, run one client per stream, each with its own key, and dedupe on `tweet.id` across both. Run the client on your own server: your key is private.

The stream only carries the accounts on your tracked list. Add them in the dashboard or with `POST https://api.1322.io/v1/tracked` (see the [X quick start](https://1322.io/docs/x)); the stream picks up list changes on its own, so there is no need to reconnect.

## node

```bash
cd node
npm install
API_KEY=your-normal-key WS_URL=wss://ws.normal.1322.io/ws/normal node index.js
```

## python

```bash
cd python
pip install -r requirements.txt
API_KEY=your-normal-key WS_URL=wss://ws.normal.1322.io/ws/normal python main.py
```

Output looks like this:

```
connected
[2026-10-15T14:03:21+00:00] TWEET @exampledesk: Q3 numbers are live on the blog.
```

## Event shape

Every frame is a text frame holding one JSON object. The client branches on `type`. This is the documented `tweet.mini.update` frame (trimmed):

```json
{
  "id": "6f1d2c3b-1322-4a5e-9b7c-0d1e2f3a4b5c",
  "type": "tweet.mini.update",
  "source": "1322",
  "tweet": {
    "id": "1978456123456789012",
    "type": "TWEET",
    "created_at": 1792073001000,
    "author": {
      "id": "1500000000000000001",
      "handle": "exampledesk",
      "name": "Example Desk",
      "verified": false,
      "metrics": {
        "following": 210,
        "followers": 48210
      }
    },
    "subtweet": null,
    "reply": null,
    "quoted": null,
    "body": {
      "text": "Q3 numbers are live on the blog.",
      "urls": [],
      "mentions": []
    },
    "media": {
      "images": [],
      "videos": [],
      "thumbnails": []
    }
  }
}
```

- `tweet.type` is `TWEET`, `RETWEET`, `QUOTE` or `REPLY`; `tweet.created_at` is Unix milliseconds.
- The client reads `tweet.author.handle` and `tweet.body.text`.

## What the client does

- A tweet arrives in stages that share one `tweet.id`: `tweet.mini.update` always comes first, and `tweet.update`, `tweet.update.expanded` and `tweet.full` follow when the tweet has more to add (cards, quoted chains, untruncated text). The client prints each tweet once, on its first stage, and skips later stages of the same `tweet.id`. If you store tweets, merge the stages instead: keep the longest `body.text`, union the media and never overwrite a filled field with an empty one.
- `tweet.deleted` prints a delete line. Profile, follow and pinned-tweet events (`profile.update`, `following.update`, `profile.pinned.update`, `profile.unpinned.update`) are skipped here; the [reference](https://1322.io/docs) lists every type.
- The server pings and both libraries answer automatically. On disconnect the client reconnects with a capped backoff (1s, 2s, 4s ... up to 30s). Events are not queued while you are disconnected.

## Pricing

X Starter is $250/month for 100 accounts, WebSocket included. A one-day evaluation is available on request, reviewed by the team, no card: https://1322.io/trial. All plans: https://1322.io/pricing

1322 covers eight sources: X (Twitter), Truth Social, Instagram, YouTube, TikTok, Binance Square, FOMO and News. Each source has its own WebSocket feed and key, managed in one dashboard. Signed webhooks are also available for all eight sources, one destination per source, in one shared event schema: https://1322.io/docs/webhooks

## Related

- [1322-client](https://github.com/1322monitors/1322-client) - installable, typed version of this script (npm)
- [kol-tweet-alert-bot](https://github.com/1322monitors/kol-tweet-alert-bot) - contract-address detection + Telegram alerts
- [prediction-market-router](https://github.com/1322monitors/prediction-market-router) - keyword match + webhook router
- [social-monitor-examples](https://github.com/1322monitors/social-monitor-examples) - minimal consumers, one per source

PRs welcome.
