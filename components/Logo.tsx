import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
  withWordmark?: boolean;
}

export function Logo({
  href = "/dashboard",
  className,
  withWordmark = true,
}: LogoProps) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid place-items-center w-7 h-7 rounded-md bg-[#01696f] text-white font-bold text-sm">
        A
      </span>
      {withWordmark && (
        <span className="font-semibold tracking-tight text-[#1a1916]">
          Alla LMS
        </span>
      )}
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
