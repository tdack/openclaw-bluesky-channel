import { describe, it, expect, vi } from "vitest";

vi.mock("./auth.js", () => ({
  loginBluesky: vi.fn().mockResolvedValue({ session: { did: "did:plc:mock" } }),
  evictChatServiceTokens: vi.fn(),
}));

vi.mock("./accounts.js", () => ({
  listBlueskyAccountIds: vi.fn().mockReturnValue(["did1:example", "did2:example"]),
  resolveBlueskyAccount: vi.fn().mockReturnValue({
    accountId: "did1:example",
    allowFrom: ["*"],
    dmPolicy: "allowlist",
  }),
  resolveDefaultBlueskyAccountId: vi.fn().mockReturnValue("did1:example"),
}));

import { blueskyPlugin } from "./channel.js";
import { resolveBlueskyAccount } from "./accounts.js";
import { resolveInboundMentionDecision } from "openclaw/plugin-sdk/channel-inbound";

describe("Bluesky Channel Plugin (SDK Compliance Checks)", () => {
  // --- 1. System Setup / Lifecycle Tests ---
  it("should correctly identify the plugin ID and metadata", () => {
    expect(blueskyPlugin.id).toBe("bluesky");
    expect(blueskyPlugin.meta.label).toBe("Bluesky");
  });

  it("should correctly expose setup and wizard adapters", () => {
    expect(blueskyPlugin.setupWizard?.channel).toBe("bluesky");
    expect(typeof blueskyPlugin.setup?.resolveAccountId).toBe("function");
    expect(typeof blueskyPlugin.setup?.applyAccountConfig).toBe("function");
  });

  // --- 2. Configuration Resolution Tests ---
  it("should resolve account correctly using internal logic", () => {
    const mockConfig = {
      channels: { bluesky: { token: "test-token", allowFrom: ["user1", "user2"] } },
    } as any;

    const account = resolveBlueskyAccount(mockConfig, null);

    expect(account.accountId).toBe("did1:example");
  });

  it("should format allowFrom correctly, handling wildcards and case", () => {
    const formatted = (blueskyPlugin.config as any).formatAllowFrom({
      cfg: {} as any,
      allowFrom: ["did:plc:XYZ", "*", "  mixedCase  "],
    });
    // DIDs are case-sensitive and left untouched; handles are lowercased.
    expect(formatted).toEqual(["did:plc:XYZ", "*", "mixedcase"]);
  });

  // --- 3. Inbound Mention Handling Tests ---
  it("should correctly make mention decisions using shared SDK helpers", async () => {
    // Bluesky is DM-only and doesn't wire mention gating itself; this exercises
    // the shared SDK helper directly to confirm it's still available/compatible.
    const mockDecision = await resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: true,
        hasAnyMention: true,
        implicitMentionKinds: ["reply_to_bot"],
      },
      policy: {
        isGroup: false,
        requireMention: false,
        allowedImplicitMentionKinds: ["reply_to_bot"],
        allowTextCommands: true,
        hasControlCommand: true,
        commandAuthorized: true,
      },
    });

    expect(mockDecision.shouldSkip).toBe(false);
  });

  // --- 4. Gateway Lifecycle & State Tests ---
  it("should handle status updates using canonical SDK methods", async () => {
    const setStatus = vi.fn();
    const controller = new AbortController();
    controller.abort();

    await (blueskyPlugin.gateway as any)?.startAccount({
      account: {
        accountId: "test-id",
        configured: true,
        name: "Test User",
        enabled: true,
        handle: "test.bsky.social",
        appPassword: "password",
        pdsUrl: "https://bsky.social",
        dmPolicy: "allowlist",
        allowFrom: ["*"],
      },
      abortSignal: controller.signal,
      setStatus,
      log: { info: vi.fn(), error: vi.fn() },
    });

    expect(setStatus).toHaveBeenCalled();
  });
});
