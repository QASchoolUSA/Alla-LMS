"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userName: string | null;
  userEmail: string;
  isAdmin?: boolean;
}

export default function StudentTopNav({
  userName,
  userEmail,
  isAdmin = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-student-menu]")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-black/[0.06]">
      <div className="max-w-5xl mx-auto h-14 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isActive("/dashboard")
                  ? "text-[#01696f] bg-[#01696f]/8"
                  : "text-[#6b6a66] hover:text-[#1a1916] hover:bg-black/[0.04]"
              )}
            >
              Home
            </Link>
            <Link
              href="/courses"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isActive("/courses")
                  ? "text-[#01696f] bg-[#01696f]/8"
                  : "text-[#6b6a66] hover:text-[#1a1916] hover:bg-black/[0.04]"
              )}
            >
              My Courses
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/dashboard"
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5",
                  isActive("/admin")
                    ? "text-[#01696f] bg-[#01696f]/8"
                    : "text-[#6b6a66] hover:text-[#1a1916] hover:bg-black/[0.04]"
                )}
              >
                <LayoutDashboard size={14} aria-hidden />
                Admin
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="relative" data-student-menu>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-black/[0.04] transition-colors"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <Avatar name={userName ?? userEmail} size={32} />
            <span className="hidden md:inline text-sm font-medium text-[#1a1916] max-w-[160px] truncate">
              {userName ?? userEmail}
            </span>
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-black/[0.06]">
                <p className="text-sm font-medium text-[#1a1916] truncate">
                  {userName ?? "Student"}
                </p>
                <p className="text-xs text-[#6b6a66] truncate">{userEmail}</p>
              </div>
              {isAdmin ? (
                <Link
                  href="/admin/dashboard"
                  role="menuitem"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-[#01696f] font-medium hover:bg-black/[0.04] transition-colors border-b border-black/[0.06]"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard size={16} aria-hidden />
                  Admin panel
                </Link>
              ) : null}
              <button
                type="button"
                onClick={signOut}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#1a1916] hover:bg-black/[0.04] transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
