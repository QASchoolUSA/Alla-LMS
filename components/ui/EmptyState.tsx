import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16 rounded-xl border border-dashed border-black/10 bg-white/40",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-[#b0afab] [&>svg]:w-10 [&>svg]:h-10">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#1a1916]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[#6b6a66]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
