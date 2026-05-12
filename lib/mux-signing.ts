import "server-only";
import { SignJWT, importPKCS8 } from "jose";
import { env } from "@/lib/env";

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

  const pem = Buffer.from(env.mux.signingPrivateKey, "base64").toString("utf-8");
  const privateKey = await importPKCS8(pem, "RS256");

  return await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: env.mux.signingKeyId, typ: "JWT" })
    .setSubject(playbackId)
    .setAudience(aud)
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .sign(privateKey);
}
