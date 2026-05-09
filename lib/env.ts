/**
 * Centralized environment variable access with friendly errors.
 *
 * Server-only secrets are guarded so they cannot be read in client bundles.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your .env.local file.`
    );
  }
  return value;
}

export const env = {
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    get serviceRoleKey() {
      return required(
        "SUPABASE_SERVICE_ROLE_KEY",
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    },
  },

  mux: {
    get tokenId() {
      return required("MUX_TOKEN_ID", process.env.MUX_TOKEN_ID);
    },
    get tokenSecret() {
      return required("MUX_TOKEN_SECRET", process.env.MUX_TOKEN_SECRET);
    },
    get signingKeyId() {
      return required("MUX_SIGNING_KEY_ID", process.env.MUX_SIGNING_KEY_ID);
    },
    get signingPrivateKey() {
      return required(
        "MUX_SIGNING_PRIVATE_KEY",
        process.env.MUX_SIGNING_PRIVATE_KEY
      );
    },
    get webhookSecret() {
      return required("MUX_WEBHOOK_SECRET", process.env.MUX_WEBHOOK_SECRET);
    },
  },

  chatwoot: {
    baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL ?? "",
    websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN ?? "",
    get identityToken() {
      return required(
        "CHATWOOT_IDENTITY_TOKEN",
        process.env.CHATWOOT_IDENTITY_TOKEN
      );
    },
  },
};

export const isSupabaseConfigured = Boolean(
  env.supabase.url && env.supabase.anonKey
);

/** All three are required: layout calls `generateChatwootHmac(identityToken)` server-side. */
export const isChatwootConfigured = Boolean(
  env.chatwoot.baseUrl &&
    env.chatwoot.websiteToken &&
    process.env.CHATWOOT_IDENTITY_TOKEN
);
