import {
  collectSimpleChannelFieldAssignments,
  getChannelSurface,
  type ResolverContext,
  type SecretDefaults,
} from "openclaw/plugin-sdk/channel-secret-basic-runtime";

export const secretTargetRegistryEntries: import("openclaw/plugin-sdk/channel-secret-basic-runtime").SecretTargetRegistryEntry[] =
  [
    {
      id: "channels.bluesky.accounts.*.appPassword",
      targetType: "channels.bluesky.accounts.*.appPassword",
      configFile: "openclaw.json",
      pathPattern: "channels.bluesky.accounts.*.appPassword",
      secretShape: "secret_input",
      expectedResolvedValue: "string",
      includeInPlan: true,
      includeInConfigure: true,
      includeInAudit: true,
    },
    {
      id: "channels.bluesky.appPassword",
      targetType: "channels.bluesky.appPassword",
      configFile: "openclaw.json",
      pathPattern: "channels.bluesky.appPassword",
      secretShape: "secret_input",
      expectedResolvedValue: "string",
      includeInPlan: true,
      includeInConfigure: true,
      includeInAudit: true,
    },
  ];

export function collectRuntimeConfigAssignments(params: {
  config: { channels?: Record<string, unknown> };
  defaults?: SecretDefaults;
  context: ResolverContext;
}): void {
  const resolved = getChannelSurface(params.config, "bluesky");
  if (!resolved) {
    return;
  }
  const { channel: bluesky, surface } = resolved;
  collectSimpleChannelFieldAssignments({
    channelKey: "bluesky",
    field: "appPassword",
    channel: bluesky,
    surface,
    defaults: params.defaults,
    context: params.context,
    topInactiveReason: "no enabled account inherits this top-level Bluesky appPassword.",
    accountInactiveReason: "Bluesky account is disabled.",
  });
}

export const channelSecrets = {
  secretTargetRegistryEntries,
  collectRuntimeConfigAssignments,
};
