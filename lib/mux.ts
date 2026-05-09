import "server-only";
import Mux from "@mux/mux-node";
import { SignJWT, importPKCS8 } from "jose";
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
 * Sign a JWT for a private playback ID.
 *
 * The Mux dashboard exports the signing private key as a base64-encoded
 * PEM (PKCS#8). We decode then import using `jose` so we don't depend on
 * Node-only crypto primitives in edge runtimes.
 */
export async function signPlaybackToken(
  playbackId: string,
  opts: { ttlSeconds?: number; audience?: "v" | "t" | "g" | "s" } = {}
): Promise<string> {
  const ttl = opts.ttlSeconds ?? 60 * 60 * 2; // 2 hours
  const aud = opts.audience ?? "v"; // v = video playback

  const pem = Buffer.from(env.mux.signingPrivateKey, "base64").toString("utf-8");
  const privateKey = await importPKCS8(pem, "RS256");

  return await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: env.mux.signingKeyId, typ: "JWT" })
    .setSubject(playbackId)
    .setAudience(aud)
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .sign(privateKey);
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
