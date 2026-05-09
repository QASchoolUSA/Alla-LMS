"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, LayoutDashboard, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
};

interface MobileNavProps {
  isAdmin?: boolean;
}

export default function MobileNav({ isAdmin = false }: MobileNavProps) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/courses", label: "Courses", icon: BookOpen },
    ...(isAdmin
      ? [{ href: "/admin/dashboard", label: "Admin", icon: LayoutDashboard }]
      : []),
    { href: "#chat", label: "Chat", icon: MessageCircle },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-black/[0.06] flex md:hidden z-40 pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Primary"
    >
      {tabs.map(({ href, label, icon: Icon }: Tab) => {
        const isChat = href === "#chat";
        const active =
          !isChat &&
          (pathname === href ||
            pathname?.startsWith(`${href}/`) ||
            (href === "/admin/dashboard" && pathname?.startsWith("/admin")));

        const onClick = isChat
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              window.$chatwoot?.toggle();
            }
          : undefined;

        return (
          <Link
            key={label}
            href={isChat ? "#" : href}
            onClick={onClick}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors min-w-[44px] min-h-[44px]",
              active ? "text-[#01696f]" : "text-[#6b6a66] hover:text-[#1a1916]"
            )}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
