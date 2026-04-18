#!/bin/sh
set -e

CONFIG_DIR=/root/.openclaw
CONFIG_FILE=$CONFIG_DIR/openclaw.json
PLUGIN_MARKER=$CONFIG_DIR/.bluesky-plugin-installed

mkdir -p "$CONFIG_DIR"

# Install the bluesky plugin if not already done.
# Use a minimal bootstrap config first to avoid chicken-and-egg: the full
# config references the bluesky channel which requires the plugin to exist.
if [ ! -f "$PLUGIN_MARKER" ]; then
  echo "Writing bootstrap config for plugin install..."
  envsubst < /config/openclaw.bootstrap.json.tmpl > "$CONFIG_FILE"

  echo "Installing openclaw-bluesky plugin..."
  # Specify version to bypass ClawHub routing (bare name resolves as a skill there)
  openclaw plugins install "openclaw-bluesky-channel@2026.4.18"

  touch "$PLUGIN_MARKER"
  echo "Plugin installed."
fi

# Write full config (overwrites bootstrap)
echo "Writing full config..."
envsubst < /config/openclaw.json.tmpl > "$CONFIG_FILE"

echo "Starting OpenClaw gateway..."
exec openclaw gateway run --bind loopback --port 18790
