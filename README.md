# twitter-websocket-client

Minimal real-time Twitter/X client over WebSocket. Connects, subscribes to the
accounts on your tracked list, prints new tweets as they land. Node and Python.

I wrote this for my own alert bots after the official streaming API got pulled
and polling turned out to be too slow. It talks to the [1322](https://1322.io)
detection feed (a managed real-time WebSocket API — no Twitter dev account, no
read caps), but the consumer pattern is generic; swap the URL for any
tweet-over-websocket source.

Typical delivery is ~150-250ms from when the tweet posts. Docs for the event
shape: https://1322.io/docs — platform page: https://1322.io/platforms/x

Piping tracked tweets into a Discord channel: https://1322.io/blog/twitter-to-discord-bot
How this compares to other services: https://1322.io/alternatives/tweetstream · https://1322.io/alternatives/twitterapi-io

## node

```bash
cd node
npm install
API_KEY=your-key WS_URL=wss://1322.io/your-ws-path node index.js
```

## python

```bash
cd python
pip install -r requirements.txt
API_KEY=your-key WS_URL=wss://1322.io/your-ws-path python main.py
```

Get a key + your ws path from the dashboard api-access page after signup.

## event shape

```json
{
  "platform": "x",
  "eventType": "tweet.full",
  "handle": "someaccount",
  "content": "gm",
  "metrics": { "likes": 12, "retweets": 3 },
  "timestamp": "2026-06-12T12:00:00Z"
}
```

Events arrive in stages (mini -> update -> expanded -> full) so you get the
earliest signal first, then the enriched version. Dedupe on the tweet id if you
only want one hit per tweet.

PRs welcome.
