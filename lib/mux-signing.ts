import "server-only";
import { createPrivateKey, type KeyObject } from "node:crypto";
import { SignJWT, importPKCS8, type CryptoKey } from "jose";
import { env } from "@/lib/env";

/**
 * Mux may show the private key as base64-wrapped PEM, or users paste PEM directly
 * into Vercel (multi-line). Accept both; Node can load PKCS#8 and legacy PKCS#1 RSA PEM.
 */
function pemFromMuxSigningPrivateKeyEnv(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes("-----BEGIN")) {
    return trimmed.replace(/\r\n/g, "\n");
  }
  const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
  if (decoded.includes("-----BEGIN")) {
    return decoded.trim().replace(/\r\n/g, "\n");
  }
  throw new Error(
    "MUX_SIGNING_PRIVATE_KEY: expected PEM (-----BEGIN...) or base64-encoded PEM"
  );
}

async function rsaPrivateKeyForMuxJwt(pem: string): Promise<CryptoKey | KeyObject> {
  try {
    return await importPKCS8(pem, "RS256");
  } catch {
    return createPrivateKey(pem);
  }
}

/**
 * Sign a JWT for a private playback ID.
 *
 * Kept separate from `lib/mux.ts` so student-facing routes do not load
 * `@mux/mux-node` (upload/admin SDK), which can break or bloat serverless bundles.
 */
export async function signPlaybackToken(
  playbackId: string,
  opts: { ttlSeconds?: number; audience?: "v" | "t" | "g" | "s" } = {}
): Promise<string> {
  const ttl = opts.ttlSeconds ?? 60 * 60 * 2;
  const aud = opts.audience ?? "v";

  const pem = pemFromMuxSigningPrivateKeyEnv(env.mux.signingPrivateKey);
  const privateKey = await rsaPrivateKeyForMuxJwt(pem);

  return await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: env.mux.signingKeyId, typ: "JWT" })
    .setSubject(playbackId)
    .setAudience(aud)
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .sign(privateKey);
}
