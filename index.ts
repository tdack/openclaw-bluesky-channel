import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { blueskyPlugin } from "./src/channel.js";
import { setBlueskyRuntime } from "./src/runtime.js";

export default defineChannelPluginEntry({
  id: "bluesky",
  name: "Bluesky",
  description: "Bluesky DM channel plugin for OpenClaw",
  plugin: blueskyPlugin,
  setRuntime: setBlueskyRuntime,
});
