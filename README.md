# openclaw-bluesky

Bluesky DM channel plugin for [OpenClaw](https://openclaw.ai), powered by the AT Protocol chat API.

## Installation

```bash
openclaw plugins install openclaw-bluesky
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

## License

MIT © [Troy Dack](https://github.com/tdack)
