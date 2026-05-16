import { requireUser } from "@/lib/auth";
import { profileMatchesRole } from "@/lib/roles";
import StudentTopNav from "@/components/StudentTopNav";
import MobileNav from "@/components/MobileNav";
import ChatwootWidget from "@/components/ChatwootWidget";
import { generateChatwootHmac } from "@/lib/chatwoot";
import { env, isChatwootConfigured } from "@/lib/env";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isAdmin = profileMatchesRole(user.profile.role, "admin");

  let chatwoot: React.ReactNode = null;
  if (isChatwootConfigured) {
    try {
      const hmac = generateChatwootHmac(user.id);
      chatwoot = (
        <ChatwootWidget
          baseUrl={env.chatwoot.baseUrl}
          websiteToken={env.chatwoot.websiteToken}
          userId={user.id}
          userEmail={user.email}
          userName={user.profile.full_name ?? user.email}
          userHmac={hmac}
        />
      );
    } catch {
      // Misconfigured Chatwoot env must not break student pages.
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f6f2]">
      <StudentTopNav
        userName={user.profile.full_name}
        userEmail={user.email}
        isAdmin={isAdmin}
      />
      <main className="pb-24 md:pb-12">{children}</main>
      <MobileNav isAdmin={isAdmin} />
      {chatwoot}
    </div>
  );
}
