import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "primary";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-black/[0.05] text-[#6b6a66]",
  success: "bg-[#437a22]/10 text-[#437a22]",
  warning: "bg-[#b8761b]/12 text-[#b8761b]",
  error: "bg-[#c0392b]/10 text-[#c0392b]",
  info: "bg-blue-500/10 text-blue-700",
  primary: "bg-[#01696f]/10 text-[#01696f]",
};

export function Badge({ className, tone = "neutral", ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        toneStyles[tone],
        className
      )}
      {...rest}
    />
  );
}
