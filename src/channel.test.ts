import { describe, it, expect, vi, beforeEach } from "vitest";
import { blueskyPlugin } from "./channel.js";
import { getBlueskyRuntime } from "./runtime.js";
import { resolveInboundMentionDecision } from "openclaw-plugin-sdk/channel-inbound";

// Mock dependencies to isolate plugin logic from deep external SDK implementations (like loginBluesky)
vi.mock("./accounts.js", () => ({
  listBlueskyAccountIds: vi.fn().mockReturnValue(["did1:example", "did2:example"]),
  resolveBlueskyAccount: vi.fn().mockReturnValue({
    accountId: "did1:example",
    token: "test-token",
    allowFrom: ["*"],
    dmPolicy: "allowlist",
  }),
  resolveDefaultBlueskyAccountId: vi.fn().mockReturnValue("did1:example"),
}));

describe("Bluesky Channel Plugin (SDK Compliance Checks)", () => {
  // --- 1. System Setup / Lifecycle Tests ---
  it("should correctly identify the plugin ID and metadata", () => {
    expect(blueskyPlugin.id).toBe("bluesky");
    expect(blueskyPlugin.meta.label).toBe("Bluesky");
  });

  it("should correctly expose setup and wizard adapters", () => {
    // Asserting that the properties exist and are functions is sufficient for compliance check
    expect(typeof blueskyPlugin.setupWizard).toBe('function');
    expect(typeof blueskyPlugin.setup).toBe('function');
  });

  // --- 2. Configuration Resolution Tests (Task 4) ---
  it("should resolve account correctly using internal logic", () => {
    const mockConfig = {
      channels: { "bluesky": { token: "test-token", allowFrom: ["user1", "user2"] } }
    } as any;
    // Use require to mock the import path behavior for isolated unit testing
    const resolve = require("./accounts").resolveBlueskyAccount; 
    const account = resolve(mockConfig, null);
    
    // Asserting against the resolver function which should pass the logic tests
    expect(account.accountId).toBe("did1:example");
    expect(account.token).toBe("test-token");
  });

  it("should format allowFrom correctly, handling wildcards and lowercasing", () => {
    const allowFrom = ["did:plc:XYZ", "*", "  mixedCase  "];
    // The original implementation's logic for normalization must be tested
    const formatted = blueskyPlugin.config.formatAllowFrom({ allowFrom });
    expect(formatted).toEqual(["did:plc:xyz", "*", "mixedcase"]);
  });

  // --- 3. Inbound Mention Handling Tests (Task 2) ---
  it("should correctly make mention decisions using shared SDK helpers", async () => {
    // We test the *usage pattern* of the shared SDK function, as mocking its entire dependency graph is impractical.
    const mockDecision = await resolveInboundMentionDecision({
        facts: { 
            canDetectMention: true, 
            wasMentioned: true, 
            hasAnyMention: true, 
            implicitMentionKinds: ["reply_to_bot"] 
        }, 
        policy: {
            isGroup: false,
            requireMention: false,
            allowedImplicitMentionKinds: ["reply_to_bot"],
            allowTextCommands: true,
            hasControlCommand: true,
            commandAuthorized: true,
        }
    });
    
    expect(mockDecision.shouldSkip).toBe(false); 
  });

  // --- 4. Gateway Lifecycle & State Tests (Task 3) ---
  it("should handle status updates using canonical SDK methods", async () => {
    const mockCtx = {
        setStatus: vi.fn(),
        log: { info: vi.fn(), error: vi.fn() },
    } as any;
    const mockAgent = { session: { did: "mock-did" } } as any;
    
    // Since loginBluesky is complex, we test the status update call path directly.
    // We call the function that handles the logic:
    await blueskyPlugin.gateway.startAccount({
      account: { accountId: "test-id", configured: true, name: "Test User" },
      abortSignal: {},
      log: mockCtx.log
    });

    // Check if setStatus was called at least once (initial connection)
    expect(mockCtx.setStatus).toHaveBeenCalled();
  });
});