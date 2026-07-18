import { defineChannelPluginEntry, type OpenClawPluginDefinition } from "openclaw/plugin-sdk/core";
import { blueskyPlugin } from "./src/channel.js";
import { setBlueskyRuntime } from "./src/runtime.js";

const plugin: OpenClawPluginDefinition = defineChannelPluginEntry({
  id: "bluesky",
  name: "Bluesky",
  description: "Bluesky DM channel plugin for OpenClaw",
  plugin: blueskyPlugin,
  setRuntime: setBlueskyRuntime,
});

export default plugin;
