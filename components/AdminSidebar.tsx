"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/students", label: "Students", icon: Users },
];

interface Props {
  userName: string | null;
  userEmail: string;
}

export default function AdminSidebar({ userName, userEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const navInner = (
    <>
      <div className="px-5 h-14 flex items-center border-b border-black/[0.06]">
        <Logo href="/admin/dashboard" />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-[#01696f]/8 text-[#01696f]"
                  : "text-[#1a1916] hover:bg-black/[0.04]"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-black/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={userName ?? userEmail} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#1a1916] truncate">
              {userName ?? "Admin"}
            </p>
            <p className="text-xs text-[#6b6a66] truncate">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="w-9 h-9 grid place-items-center rounded-lg text-[#6b6a66] hover:text-[#c0392b] hover:bg-black/[0.04] transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 h-14 bg-white border-b border-black/[0.06] flex items-center justify-between px-4">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-10 h-10 grid place-items-center rounded-lg hover:bg-black/[0.05]"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-black/[0.06] sticky top-0 h-screen">
        {navInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white flex flex-col animate-[slideRight_180ms_ease-out]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-lg hover:bg-black/[0.05]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {navInner}
          </div>
          <style>{`
            @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
          `}</style>
        </div>
      )}
    </>
  );
}
