import {
  emptyPluginConfigSchema,
  type OpenClawPluginApi,
  type OpenClawPluginDefinition,
} from "openclaw/plugin-sdk/core";
import { blueskyPlugin } from "./src/channel.js";
import { setBlueskyRuntime } from "./src/runtime.js";

const plugin: OpenClawPluginDefinition = {
  id: "bluesky",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setBlueskyRuntime(api.runtime);
    api.registerChannel(blueskyPlugin);
  },
};

export default plugin;
