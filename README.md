# twitter-websocket-client

Minimal real-time Twitter/X client over WebSocket, in Node and Python: connect, subscribe to the accounts on your tracked list, and print new tweets as they land, typically 150-250ms after they post. It is a Twitter streaming API alternative for people who need a real-time Twitter API for specific accounts without an X developer account or read caps; it talks to the 1322 managed feed, but the consumer pattern is generic. Maintained by the 1322 team.

Docs for the event shape: https://1322.io/docs — platform page: https://1322.io/platforms/x

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

## Related

- [1322-client](https://github.com/1322monitors/1322-client) - installable, typed version of this script (npm)
- [kol-tweet-alert-bot](https://github.com/1322monitors/kol-tweet-alert-bot) - contract-address detection + Telegram alerts
- [prediction-market-router](https://github.com/1322monitors/prediction-market-router) - keyword match + webhook router
- [social-monitor-examples](https://github.com/1322monitors/social-monitor-examples) - minimal consumers for all seven platforms

PRs welcome.
