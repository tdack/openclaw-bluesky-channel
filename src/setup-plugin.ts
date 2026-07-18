import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-plugin-common";
import {
  listBlueskyAccountIds,
  resolveBlueskyAccount,
  resolveDefaultBlueskyAccountId,
} from "./accounts.js";
import { normalizeBlueskyId } from "./identifiers.js";
import { blueskySetupAdapter, blueskySetupWizard } from "./setup-surface.js";
import type { ResolvedBlueskyAccount } from "./types.js";

export const CHANNEL_ID = "bluesky";

/**
 * Setup-only subset of the Bluesky channel plugin: config resolution and the
 * setup wizard, with no dependency on @atproto/api or the gateway/poll runtime.
 * Used directly by setup-entry.ts, and spread into the full plugin in channel.ts.
 */
export const blueskySetupChannelPlugin: ChannelPlugin<ResolvedBlueskyAccount> = {
  id: CHANNEL_ID,

  meta: {
    id: CHANNEL_ID,
    label: "Bluesky",
    selectionLabel: "Bluesky (DMs)",
    detailLabel: "Bluesky DM",
    docsPath: "/channels/bluesky",
    blurb: "Connect OpenClaw to Bluesky DMs via the AT Protocol chat API.",
    order: 85,
  },

  capabilities: {
    chatTypes: ["direct"],
    media: false,
  },

  setupWizard: blueskySetupWizard,
  setup: blueskySetupAdapter,

  reload: { configPrefixes: [`channels.${CHANNEL_ID}`] },

  config: {
    listAccountIds: (cfg) => listBlueskyAccountIds(cfg as Record<string, unknown>),
    resolveAccount: (cfg, accountId) =>
      resolveBlueskyAccount(cfg as Record<string, unknown>, accountId),
    defaultAccountId: (cfg) => resolveDefaultBlueskyAccountId(cfg as Record<string, unknown>),
    isConfigured: (account) => account.configured,
    describeAccount: (account) => ({
      accountId: account.accountId,
      name: account.name,
      handle: account.handle,
      pdsUrl: account.pdsUrl,
      enabled: account.enabled,
      configured: account.configured,
    }),
    resolveAllowFrom: ({ cfg, accountId }) =>
      resolveBlueskyAccount(cfg as Record<string, unknown>, accountId).allowFrom.map((entry) =>
        String(entry),
      ),
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => (entry === "*" ? "*" : normalizeBlueskyId(entry)))
        .filter(Boolean),
  },
};
