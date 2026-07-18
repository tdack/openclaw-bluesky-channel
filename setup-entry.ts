import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
import { blueskySetupChannelPlugin } from "./src/setup-plugin.js";

export default defineSetupPluginEntry(blueskySetupChannelPlugin);
