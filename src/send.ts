import type { BskyAgent } from "@atproto/api";
import { chatApiGet, chatApiPost } from "./auth.js";

const LXM_SEND_MESSAGE = "chat.bsky.convo.sendMessage";
const LXM_GET_CONVO_FOR_MEMBERS = "chat.bsky.convo.getConvoForMembers";

type GetConvoForMembersResponse = {
  convo: { id: string };
};

type SendMessageResponse = {
  id: string;
  rev: string;
};

/**
 * Resolve a conversation ID from a DID or handle.
 * - DID (did:plc:… / did:web:…) → look up convo directly.
 * - Handle (contains a dot, e.g. user.bsky.social) → resolve to DID first via resolveHandle.
 * - Anything else is assumed to already be a convoId and returned as-is.
 */
async function resolveConvoId(agent: BskyAgent, target: string): Promise<string> {
  let did: string | undefined;

  if (target.startsWith("did:")) {
    did = target;
  } else if (target.includes(".")) {
    // Looks like a handle — strip leading @ if present and resolve to DID.
    const handle = target.startsWith("@") ? target.slice(1) : target;
    const resolved = await agent.resolveHandle({ handle });
    did = resolved.data.did;
  }

  if (did) {
    const data = await chatApiGet<GetConvoForMembersResponse>(agent, LXM_GET_CONVO_FOR_MEMBERS, {
      members: did,
    });
    return data.convo.id;
  }

  // Already a convoId
  return target;
}

/**
 * Send a text message to a Bluesky DM conversation.
 *
 * @param agent - Authenticated BskyAgent for the sending account.
 * @param target - Either a convoId or a DID (resolved to convoId automatically).
 * @param text - The message text to send.
 * @returns The convoId used and the new message ID.
 */
export async function sendBlueskyMessage(
  agent: BskyAgent,
  target: string,
  text: string,
): Promise<{ convoId: string; messageId: string }> {
  const convoId = await resolveConvoId(agent, target);
  const data = await chatApiPost<SendMessageResponse>(agent, LXM_SEND_MESSAGE, {
    convoId,
    message: { text },
  });
  return { convoId, messageId: data.id };
}
