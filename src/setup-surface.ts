import type { ChannelSetupAdapter } from "openclaw/plugin-sdk/channel-setup";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/routing";
import { hasConfiguredSecretInput } from "openclaw/plugin-sdk/secret-input";
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/setup";
import {
  createStandardChannelSetupStatus,
  formatDocsLink,
  patchScopedAccountConfig,
  patchTopLevelChannelConfigSection,
} from "openclaw/plugin-sdk/setup";
import { resolveBlueskyAccount } from "./accounts.js";
import type { BlueskyChannelConfig } from "./types.js";

const channel = "bluesky" as const;

const DEFAULT_PDS_URL = "https://bsky.social";

const BLUESKY_SETUP_HELP_LINES = [
  "Create an App Password at: Settings → Privacy and Security → App Passwords",
  "Use an App Password — do not use your main Bluesky account password.",
  "Env vars supported: BLUESKY_HANDLE, BLUESKY_APP_PASSWORD, BLUESKY_PDS_URL.",
  `Docs: ${formatDocsLink("/channels/bluesky", "channels/bluesky")}`,
];

function getBlueskyChannelConfig(cfg: Record<string, unknown>): BlueskyChannelConfig | undefined {
  const channels = cfg?.channels as Record<string, unknown> | undefined;
  return channels?.bluesky as BlueskyChannelConfig | undefined;
}

export const blueskySetupAdapter: ChannelSetupAdapter = {
  resolveAccountId: ({ accountId }) => accountId?.trim() || DEFAULT_ACCOUNT_ID,
  applyAccountConfig: ({ cfg, accountId, input }) => {
    // inputKey mapping: token → appPassword, name → handle, url → pdsUrl
    const typedInput = input as { name?: string; token?: string; url?: string };
    const patch: Record<string, unknown> = {};
    if (typedInput.name?.trim()) {
      patch.handle = typedInput.name.trim();
    }
    if (typedInput.token?.trim()) {
      patch.appPassword = typedInput.token.trim();
    }
    if (typedInput.url?.trim()) {
      patch.pdsUrl = typedInput.url.trim();
    }
    return patchScopedAccountConfig({
      cfg,
      channelKey: channel,
      accountId,
      patch,
      ensureChannelEnabled: true,
    });
  },
};

export const blueskySetupWizard: ChannelSetupWizard = {
  channel,
  resolveAccountIdForConfigure: ({ accountOverride, defaultAccountId }) =>
    accountOverride?.trim() || defaultAccountId,
  resolveShouldPromptAccountIds: () => false,
  status: createStandardChannelSetupStatus({
    channelLabel: "Bluesky",
    configuredLabel: "configured",
    unconfiguredLabel: "needs handle and app password",
    configuredHint: "configured",
    unconfiguredHint: "needs handle and app password",
    configuredScore: 1,
    unconfiguredScore: 0,
    includeStatusLine: true,
    resolveConfigured: ({ cfg }) =>
      resolveBlueskyAccount(cfg as Record<string, unknown>).configured,
    resolveExtraStatusLines: ({ cfg }) => {
      const account = resolveBlueskyAccount(cfg as Record<string, unknown>);
      if (!account.configured) {
        return [];
      }
      return [`Handle: @${account.handle}`, `PDS: ${account.pdsUrl}`];
    },
  }),
  introNote: {
    title: "Bluesky setup",
    lines: BLUESKY_SETUP_HELP_LINES,
  },
  envShortcut: {
    prompt: "BLUESKY_HANDLE and BLUESKY_APP_PASSWORD detected. Use env vars?",
    preferredEnvVar: "BLUESKY_APP_PASSWORD",
    isAvailable: ({ cfg, accountId }) =>
      accountId === DEFAULT_ACCOUNT_ID &&
      Boolean(process.env.BLUESKY_HANDLE?.trim()) &&
      Boolean(process.env.BLUESKY_APP_PASSWORD?.trim()) &&
      !resolveBlueskyAccount(cfg as Record<string, unknown>).configured,
    apply: async ({ cfg }) =>
      patchTopLevelChannelConfigSection({
        cfg,
        channel,
        enabled: true,
        clearFields: ["handle", "appPassword"],
        patch: {},
      }),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: channel,
      credentialLabel: "app password",
      preferredEnvVar: "BLUESKY_APP_PASSWORD",
      helpTitle: "Bluesky App Password",
      helpLines: BLUESKY_SETUP_HELP_LINES,
      envPrompt: "BLUESKY_APP_PASSWORD detected. Use env var?",
      keepPrompt: "Bluesky app password already configured. Keep it?",
      inputPrompt: "Bluesky App Password (xxxx-xxxx-xxxx-xxxx)",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const account = resolveBlueskyAccount(cfg as Record<string, unknown>, accountId);
        const channelCfg = getBlueskyChannelConfig(cfg as Record<string, unknown>);
        const rawAppPassword =
          accountId !== DEFAULT_ACCOUNT_ID
            ? channelCfg?.accounts?.[accountId]?.appPassword
            : channelCfg?.appPassword;
        return {
          accountConfigured: account.configured,
          hasConfiguredValue: hasConfiguredSecretInput(rawAppPassword),
          resolvedValue: account.appPassword,
          envValue:
            accountId === DEFAULT_ACCOUNT_ID ? process.env.BLUESKY_APP_PASSWORD?.trim() : undefined,
        };
      },
      applyUseEnv: async ({ cfg }) =>
        patchTopLevelChannelConfigSection({
          cfg,
          channel,
          enabled: true,
          clearFields: ["appPassword"],
          patch: {},
        }),
      applySet: async ({ cfg, accountId, resolvedValue }) =>
        patchScopedAccountConfig({
          cfg,
          channelKey: channel,
          accountId,
          patch: { appPassword: resolvedValue },
          ensureChannelEnabled: true,
        }),
    },
  ],
  textInputs: [
    {
      inputKey: "name",
      message: "Bluesky handle (e.g. yourbot.bsky.social)",
      placeholder: "yourbot.bsky.social",
      required: true,
      applyEmptyValue: false,
      helpTitle: "Bluesky handle",
      helpLines: ["Your bot account handle, including the domain.", "Example: mybot.bsky.social"],
      currentValue: ({ cfg, accountId }) =>
        resolveBlueskyAccount(cfg as Record<string, unknown>, accountId).handle,
      keepPrompt: (value) => `Handle set to @${value}. Keep it?`,
      validate: ({ value }) => {
        if (!value.trim()) {
          return "Handle is required.";
        }
        if (!value.includes(".")) {
          return "Handle must include the domain (e.g. yourbot.bsky.social).";
        }
        return undefined;
      },
      applySet: async ({ cfg, accountId, value }) =>
        patchScopedAccountConfig({
          cfg,
          channelKey: channel,
          accountId,
          patch: { handle: value.trim() },
          ensureChannelEnabled: true,
        }),
    },
    {
      inputKey: "url",
      message: "Personal Data Server URL (optional, leave blank for bsky.social)",
      placeholder: DEFAULT_PDS_URL,
      required: false,
      applyEmptyValue: true,
      helpTitle: "Bluesky PDS URL",
      helpLines: [
        "Only set this if you use a self-hosted PDS.",
        `Leave blank to use the default: ${DEFAULT_PDS_URL}`,
      ],
      currentValue: ({ cfg, accountId }) => {
        return (
          resolveBlueskyAccount(cfg as Record<string, unknown>, accountId).pdsUrl?.trim() ?? ""
        );
      },
      keepPrompt: (value) => `PDS URL set to ${value}. Keep it?`,
      validate: ({ value }) => {
        if (!value.trim()) {
          return undefined;
        }
        try {
          const url = new URL(value.trim());
          if (url.protocol !== "https:" && url.protocol !== "http:") {
            return "PDS URL must use https:// or http://";
          }
        } catch {
          return "Invalid PDS URL.";
        }
        return undefined;
      },
      applySet: async ({ cfg, accountId, value }) => {
        const trimmed = value.trim();
        if (accountId === DEFAULT_ACCOUNT_ID) {
          // patchTopLevelChannelConfigSection supports clearFields, needed to
          // remove pdsUrl from the top-level section when the user clears it.
          return patchTopLevelChannelConfigSection({
            cfg,
            channel,
            enabled: true,
            clearFields: trimmed ? undefined : ["pdsUrl"],
            patch: trimmed ? { pdsUrl: trimmed } : {},
          });
        }
        return patchScopedAccountConfig({
          cfg,
          channelKey: channel,
          accountId,
          // undefined drops the key from the serialized config, effectively clearing it.
          patch: { pdsUrl: trimmed || undefined },
          ensureChannelEnabled: true,
        });
      },
    },
  ],
  disable: (cfg) =>
    patchTopLevelChannelConfigSection({
      cfg,
      channel,
      patch: { enabled: false },
    }),
};
