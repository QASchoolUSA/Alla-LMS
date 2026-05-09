"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (cfg: { websiteToken: string; baseUrl: string }) => void };
    $chatwoot?: {
      toggle: () => void;
      setUser: (
        id: string,
        attrs: { email?: string; name?: string; identifier_hash?: string }
      ) => void;
    };
  }
}

interface Props {
  baseUrl: string;
  websiteToken: string;
  userId: string;
  userEmail: string;
  userName: string;
  userHmac: string;
}

export default function ChatwootWidget({
  baseUrl,
  websiteToken,
  userId,
  userEmail,
  userName,
  userHmac,
}: Props) {
  useEffect(() => {
    if (!baseUrl || !websiteToken) return;
    if (document.getElementById("chatwoot-sdk")) return;

    window.chatwootSettings = {
      hideMessageBubble: false,
      position: "right",
      locale: "en",
      type: "standard",
    };

    const script = document.createElement("script");
    script.id = "chatwoot-sdk";
    script.src = baseUrl.replace(/\/$/, "") + "/packs/js/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.chatwootSDK?.run({ websiteToken, baseUrl });
      window.addEventListener("chatwoot:ready", () => {
        window.$chatwoot?.setUser(userId, {
          email: userEmail,
          name: userName,
          identifier_hash: userHmac,
        });
      });
    };
    document.body.appendChild(script);
  }, [baseUrl, websiteToken, userId, userEmail, userName, userHmac]);

  return null;
}
