# openclaw-bluesky-channel

Bluesky DM channel plugin for [OpenClaw](https://openclaw.ai), powered by the AT Protocol chat API.

## Installation

```bash
openclaw plugins install npm:openclaw-bluesky-channel
```

This installs the plugin from npm and registers it as the `bluesky` channel. Other supported install sources:

```bash
openclaw plugins install clawhub:openclaw-bluesky-channel   # from ClawHub
openclaw plugins install git:github.com/tdack/openclaw-bluesky-channel
openclaw plugins install --link ./openclaw-bluesky-channel  # local dev checkout
```

If the channel isn't enabled automatically, enable it with:

```bash
openclaw plugins enable bluesky
```

## Onboarding

The plugin implements OpenClaw's setup wizard, so the easiest way to configure it is through the core CLI:

```bash
openclaw channels add --channel bluesky
```

This prompts for:

- **Bluesky handle** (e.g. `yourbot.bsky.social`)
- **App password** — generate one at [bsky.app/settings/app-passwords](https://bsky.app/settings/app-passwords). **Never use your main account password.**
- **PDS URL** (optional, defaults to `https://bsky.social`)

If `BLUESKY_HANDLE` and `BLUESKY_APP_PASSWORD` are already set in the environment, the wizard offers to reuse them for the default account.

You can also configure it non-interactively:

```bash
openclaw channels add --channel bluesky --account bot --name yourbot.bsky.social --token <app-password>
```

Or run the full guided setup, which covers this channel alongside the rest of your OpenClaw configuration:

```bash
openclaw setup
```

Use `openclaw configure` at any time to revisit and edit the channel's settings.

## Configuration

### Single account

For a single Bluesky account, either set environment variables before starting OpenClaw:

| Variable | Description |
|---|---|
| `BLUESKY_HANDLE` | Your Bluesky handle (e.g. `you.bsky.social`) |
| `BLUESKY_APP_PASSWORD` | An [app password](https://bsky.app/settings/app-passwords) generated in Bluesky settings |
| `BLUESKY_PDS_URL` | Your PDS URL (defaults to `https://bsky.social`) |

...or configure it directly in `openclaw.json`:

```json
{
  "channels": {
    "bluesky": {
      "enabled": true,
      "handle": "yourbot.bsky.social",
      "appPassword": "your-app-password",
      "pdsUrl": "https://bsky.social"
    }
  }
}
```

### Multiple accounts

To run more than one Bluesky account, configure each under `channels.bluesky.accounts`, keyed by an account ID of your choosing:

```json
{
  "channels": {
    "bluesky": {
      "enabled": true,
      "defaultAccount": "bot1",
      "accounts": {
        "bot1": {
          "name": "Main bot",
          "handle": "bot1.bsky.social",
          "appPassword": "app-password-1",
          "dmPolicy": "pairing"
        },
        "bot2": {
          "name": "Support bot",
          "handle": "bot2.bsky.social",
          "appPassword": "app-password-2",
          "pdsUrl": "https://pds.example.com",
          "dmPolicy": "allowlist",
          "allowFrom": ["someone.bsky.social"]
        }
      }
    }
  }
}
```

Each account accepts: `handle`, `appPassword`, `pdsUrl`, `enabled`, `name`, `dmPolicy` (`pairing` | `allowlist` | `open` | `disabled`, default `pairing`), and `allowFrom` (a list of handles/DIDs, used with `dmPolicy: "allowlist"`). Any field left unset on a named account falls back to the top-level `channels.bluesky` value. If you add a second account to a config that's still using the top-level single-account fields, `openclaw channels add` automatically promotes those into the account map for you.

Note: the `BLUESKY_*` environment variables only ever populate the **default** account — they're not usable for additional accounts.

### Secrets

`appPassword` accepts either a plain string or a `SecretRef`, so you don't have to store credentials in plaintext:

```json
{
  "appPassword": { "source": "file", "provider": "local", "id": "bluesky/bot1/appPassword" }
}
```

Supported sources: `env` (read from an environment variable), `file` (read from a configured secrets provider), and `exec` (run a command to retrieve the value). This applies to both the top-level `appPassword` and each account's `appPassword`.

The recommended way to set this up is via OpenClaw's own secrets tooling, which will prompt for the value and write the `SecretRef` for you:

```bash
openclaw secrets configure
openclaw secrets audit   # checks for any plaintext secrets left in config
```

## Requirements

- OpenClaw `>=2026.7.1`
- Node.js `>=22`

## License

MIT © [Troy Dack](https://github.com/tdack)
