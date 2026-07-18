/**
 * Normalize a Bluesky identifier (DID or handle).
 * Strips at://, @, and lowercases handles (DIDs are case-sensitive).
 */
export function normalizeBlueskyId(input: string): string {
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
export function looksLikeBlueskyId(input: string): boolean {
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
