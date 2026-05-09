import "server-only";
import crypto from "crypto";
import { env } from "@/lib/env";

/**
 * HMAC identity hash sent to Chatwoot's web SDK to prevent
 * any client from impersonating another user.
 *
 * Configure the matching token in:
 *   Chatwoot → Settings → Inboxes → <Inbox> → Configuration → Identity Validation
 */
export function generateChatwootHmac(userId: string): string {
  return crypto
    .createHmac("sha256", env.chatwoot.identityToken)
    .update(userId)
    .digest("hex");
}
