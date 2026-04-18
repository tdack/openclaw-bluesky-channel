#!/bin/sh
set -e

CONFIG_DIR=/root/.openclaw
CONFIG_FILE=$CONFIG_DIR/openclaw.json

mkdir -p "$CONFIG_DIR"

# Generate config from template on every start so env var changes take effect
envsubst < /config/openclaw.json.tmpl > "$CONFIG_FILE"
echo "Config written to $CONFIG_FILE"

# Install plugin if not already installed
if ! openclaw plugins list 2>/dev/null | grep -q "openclaw-bluesky"; then
  echo "Installing openclaw-bluesky plugin..."
  openclaw plugins install openclaw-bluesky
else
  echo "openclaw-bluesky plugin already installed"
fi

echo "Starting OpenClaw gateway..."
exec openclaw gateway run --bind loopback --port 18790
