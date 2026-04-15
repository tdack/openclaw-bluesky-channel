export type DmPolicy = "pairing" | "allowlist" | "open" | "disabled";

export type BlueskyChannelConfig = {
  enabled?: boolean;
  name?: string;
  handle?: string;
  appPassword?: string;
  /** Personal Data Server URL — defaults to https://bsky.social */
  pdsUrl?: string;
  /** Explicit default account id used when no accountId is supplied to outbound sends. */
  defaultAccount?: string;
  /** DM access control policy. Defaults to "pairing". */
  dmPolicy?: DmPolicy;
  /** Allowed sender handles or DIDs when dmPolicy is "allowlist". */
  allowFrom?: Array<string | number>;
  accounts?: Record<string, BlueskyAccountConfig>;
};

export type BlueskyAccountConfig = {
  enabled?: boolean;
  name?: string;
  handle?: string;
  appPassword?: string;
  pdsUrl?: string;
  dmPolicy?: DmPolicy;
  allowFrom?: Array<string | number>;
};

export type ResolvedBlueskyAccount = {
  accountId: string;
  name?: string;
  enabled: boolean;
  configured: boolean;
  handle: string;
  appPassword: string;
  pdsUrl: string;
  dmPolicy: DmPolicy;
  allowFrom: Array<string | number>;
};
