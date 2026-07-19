import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validateJsonSchemaValue } from "openclaw/plugin-sdk/json-schema-runtime";

const pluginManifestPath = fileURLToPath(new URL("../openclaw.plugin.json", import.meta.url));
const pluginManifest = JSON.parse(readFileSync(pluginManifestPath, "utf8"));
const blueskySchema = pluginManifest.channelConfigs.bluesky.schema;

function validate(value: unknown) {
  return validateJsonSchemaValue({
    schema: blueskySchema,
    cacheKey: "bluesky-channel-config-test",
    value,
    cache: false,
  });
}

describe("openclaw.plugin.json bluesky channel config schema", () => {
  it("accepts a single-account config", () => {
    const result = validate({
      enabled: true,
      handle: "testuser.bsky.social",
      appPassword: "aaaa-bbbb-cccc-dddd",
      pdsUrl: "https://bsky.social",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a multi-account config using every field from types.ts", () => {
    const result = validate({
      enabled: true,
      defaultAccount: "test_account_bluesky",
      accounts: {
        test_account_bluesky: {
          enabled: true,
          name: "Test Account",
          handle: "testuser.bsky.social",
          appPassword: "aaaa-bbbb-cccc-dddd",
          pdsUrl: "https://bsky.social",
          dmPolicy: "pairing",
          allowFrom: ["someone.bsky.social", 12345],
        },
      },
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a SecretRef object for the top-level appPassword", () => {
    const result = validate({
      enabled: true,
      handle: "testuser.bsky.social",
      appPassword: { source: "env", provider: "openclaw", id: "BLUESKY_APP_PASSWORD" },
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a SecretRef object for a per-account appPassword", () => {
    const result = validate({
      accounts: {
        test_account_bluesky: {
          handle: "testuser.bsky.social",
          appPassword: { source: "file", provider: "openclaw", id: "bluesky-app-password" },
        },
      },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a SecretRef object with an unknown source", () => {
    const result = validate({
      handle: "testuser.bsky.social",
      appPassword: { source: "vault", provider: "openclaw", id: "BLUESKY_APP_PASSWORD" },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an unknown top-level property", () => {
    const result = validate({
      enabled: true,
      handle: "testuser.bsky.social",
      typo: "oops",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("typo"))).toBe(true);
    }
  });

  it("rejects an unknown per-account property", () => {
    const result = validate({
      accounts: {
        test_account_bluesky: {
          handle: "testuser.bsky.social",
          typo: "oops",
        },
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("typo"))).toBe(true);
    }
  });
});
