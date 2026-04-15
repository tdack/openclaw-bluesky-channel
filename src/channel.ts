import type { BskyAgent } from "@atproto/api";
import {
  formatPairingApproveHint,
  type ChannelPlugin,
} from "openclaw/plugin-sdk/channel-plugin-common";
import {
  listBlueskyAccountIds,
  resolveBlueskyAccount,
  resolveDefaultBlueskyAccountId,
} from "./accounts.js";
import { evictChatServiceTokens, loginBluesky } from "./auth.js";
import { dispatchBlueskyInboundTurn } from "./inbound-turn.js";
import { runBlueSkyPollLoop } from "./poll.js";
import { getBlueskyRuntime, setBlueskyRuntime } from "./runtime.js";
import { sendBlueskyMessage } from "./send.js";
import { blueskySetupAdapter, blueskySetupWizard } from "./setup-surface.js";
import type { ResolvedBlueskyAccount } from "./types.js";

export { setBlueskyRuntime };

const CHANNEL_ID = "bluesky";

/**
 * Active agents keyed by accountId.
 * Stored here so the outbound adapter can access them without going through gateway context.
 */
const activeAgents = new Map<string, BskyAgent>();

/**
 * Normalize a Bluesky identifier (DID or handle).
 * Strips at://, @, and lowercases handles (DIDs are case-sensitive).
 */
function normalizeBlueskyId(input: string): string {
  let cleaned = input
    .trim()
    .replace(/^at:\/\//i, "")
    .replace(/^@/, "");
  if (!cleaned.startsWith("did:")) {
    cleaned = cleaned.toLowerCase();
  }
  return cleaned;
}

/**
 * Check if a string looks like a Bluesky identifier (DID or handle).
 */
function looksLikeBlueskyId(input: string): boolean {
  const trimmed = input.trim();
  // DID format: did:plc:xxx or did:web:xxx
  if (/^did:(plc|web):[a-zA-Z0-9._:%-]+$/.test(trimmed)) {
    return true;
  }
  // Handle format: user.bsky.social or @user.bsky.social (must have at least one dot)
  if (
    /^@?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
      trimmed,
    )
  ) {
    return true;
  }
  return false;
}

export const blueskyPlugin: ChannelPlugin<ResolvedBlueskyAccount> = {
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

  pairing: {
    idLabel: "blueskyDid",
    normalizeAllowEntry: (entry) => normalizeBlueskyId(entry),
    notifyApproval: async ({ id, accountId }) => {
      const agent = activeAgents.get(accountId ?? "default");
      if (agent) {
        await sendBlueskyMessage(agent, id, "Your pairing request has been approved!");
      }
    },
  },

  security: {
    resolveDmPolicy: ({ account }) => ({
      policy: account.dmPolicy,
      allowFrom: account.allowFrom.map(String),
      policyPath: `channels.${CHANNEL_ID}.dmPolicy`,
      allowFromPath: `channels.${CHANNEL_ID}.allowFrom`,
      approveHint: formatPairingApproveHint(CHANNEL_ID),
      normalizeEntry: (raw: string) => normalizeBlueskyId(raw.trim()),
    }),
  },

  messaging: {
    normalizeTarget: (target) => normalizeBlueskyId(target),
    targetResolver: {
      looksLikeId: (input) => looksLikeBlueskyId(input),
      hint: "<did:plc:… | handle.bsky.social | @handle>",
    },
  },

  status: {
    buildAccountSnapshot: ({ account, runtime }) => ({
      accountId: account.accountId,
      name: account.name,
      handle: account.handle,
      enabled: account.enabled,
      configured: account.configured,
      running: runtime?.running ?? false,
      lastStartAt: runtime?.lastStartAt ?? null,
      lastStopAt: runtime?.lastStopAt ?? null,
      lastError: runtime?.lastError ?? null,
      lastInboundAt: runtime?.lastInboundAt ?? null,
      lastOutboundAt: runtime?.lastOutboundAt ?? null,
    }),
  },

  gateway: {
    startAccount: async (ctx) => {
      const { account, abortSignal, log } = ctx;

      if (!account.configured) {
        throw new Error(
          `Bluesky is not configured for account "${account.accountId}" — set channels.bluesky.handle and channels.bluesky.appPassword`,
        );
      }

      log?.info?.(`Bluesky [${account.accountId}]: logging in as ${account.handle}`);

      let agent: BskyAgent;
      try {
        agent = await loginBluesky({
          handle: account.handle,
          appPassword: account.appPassword,
          pdsUrl: account.pdsUrl,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log?.error?.(`Bluesky [${account.accountId}]: login failed — ${msg}`);
        throw err;
      }

      const selfDid = agent.session?.did ?? "";
      log?.info?.(`Bluesky [${account.accountId}]: authenticated as ${selfDid}`);
      activeAgents.set(account.accountId, agent);

      await runBlueSkyPollLoop({
        agent,
        selfDid,
        abortSignal,
        callbacks: {
          onMessage: async (msg) => {
            // Re-read config each turn so live config changes take effect
            const currentCfg = getBlueskyRuntime().config.loadConfig();
            await dispatchBlueskyInboundTurn({
              account,
              agent,
              msg,
              cfg: currentCfg,
              log,
            });
          },
          onError: (err, context) => {
            log?.error?.(`Bluesky [${account.accountId}]: error in ${context} — ${err.message}`);
          },
        },
      });
    },

    stopAccount: async (ctx) => {
      const agent = activeAgents.get(ctx.account.accountId);
      if (agent?.session?.did) {
        evictChatServiceTokens(agent.session.did);
      }
      activeAgents.delete(ctx.account.accountId);
      ctx.log?.info?.(`Bluesky [${ctx.account.accountId}]: stopped`);
    },
  },

  outbound: {
    deliveryMode: "direct",
    textChunkLimit: 10000,

    sendText: async ({ to, text, accountId }) => {
      const cfg = getBlueskyRuntime().config.loadConfig();
      const resolvedAccountId =
        accountId ?? resolveDefaultBlueskyAccountId(cfg as Record<string, unknown>);
      const agent = activeAgents.get(resolvedAccountId);
      if (!agent) {
        throw new Error(
          `Bluesky: no active session for account "${resolvedAccountId}" — is the gateway running?`,
        );
      }
      const { convoId, messageId } = await sendBlueskyMessage(agent, to, text);
      return { channel: CHANNEL_ID, to: convoId, messageId };
    },
  },
};
