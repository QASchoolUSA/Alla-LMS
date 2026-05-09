import { requireUser } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("admin");

  return (
    <div className="min-h-[100dvh] bg-[#f7f6f2] md:flex">
      <AdminSidebar
        userName={user.profile.full_name}
        userEmail={user.email}
      />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
