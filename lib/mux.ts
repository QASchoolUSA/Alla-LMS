import "server-only";
import Mux from "@mux/mux-node";
import { env } from "@/lib/env";

let _mux: Mux | null = null;

export function getMux(): Mux {
  if (_mux) return _mux;
  _mux = new Mux({
    tokenId: env.mux.tokenId,
    tokenSecret: env.mux.tokenSecret,
  });
  return _mux;
}

/**
 * Best-effort verification of a Mux webhook signature.
 *
 * Header format: `t=<unix>,v1=<hex-hmac>`
 * Signed payload: `<unix>.<rawBody>`
 */
export function verifyMuxWebhook(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string])
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto
    .createHmac("sha256", env.mux.webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
