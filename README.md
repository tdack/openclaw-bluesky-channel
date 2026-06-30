# openclaw-bluesky-channel

Bluesky DM channel plugin for [OpenClaw](https://openclaw.ai), powered by the AT Protocol chat API.

## Installation

```bash
openclaw plugins install openclaw-bluesky-channel
```

## Configuration

Set the following environment variables before starting OpenClaw:

| Variable | Description |
|---|---|
| `BLUESKY_HANDLE` | Your Bluesky handle (e.g. `you.bsky.social`) |
| `BLUESKY_APP_PASSWORD` | An [app password](https://bsky.app/settings/app-passwords) generated in Bluesky settings |
| `BLUESKY_PDS_URL` | Your PDS URL (defaults to `https://bsky.social`) |

## Requirements

- OpenClaw `>=2026.1.0`
- Node.js `>=22`

## Optional X/Twitter Context

Keep this plugin focused on Bluesky DMs through the AT Protocol chat API. When
an OpenClaw agent also needs reviewed X/Twitter context, install
[TweetClaw](https://github.com/Xquik-dev/tweetclaw) as a separate companion
plugin and pass only a short source packet into the Bluesky conversation.

Useful boundaries:

- Use TweetClaw search, reply-search, follower export, user lookup, or monitors
  before drafting a Bluesky reply.
- Keep Bluesky app-password handling inside this plugin.
- Route any TweetClaw post, reply, follow, DM, media, monitor, webhook, or
  giveaway action through TweetClaw's own approval flow.

## License

MIT © [Troy Dack](https://github.com/tdack)
