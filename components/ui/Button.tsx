import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#01696f] text-white hover:bg-[#0c4e54] active:bg-[#0f3638] focus-visible:ring-2 focus-visible:ring-[#01696f]/40",
  secondary:
    "border border-black/10 bg-white text-[#1a1916] hover:bg-[#f3f0ec] active:bg-[#ece8e2] focus-visible:ring-2 focus-visible:ring-[#01696f]/30",
  ghost:
    "text-[#6b6a66] hover:text-[#1a1916] hover:bg-black/[0.04] active:bg-black/[0.07] focus-visible:ring-2 focus-visible:ring-black/15",
  danger:
    "bg-[#c0392b] text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-500/40",
};

const sizeStyles: Record<Size, string> = {
  sm: "min-h-[36px] px-3 text-sm",
  md: "min-h-[44px] px-4 text-sm",
  lg: "min-h-[48px] px-5 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      type = "button",
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          loading && "pointer-events-none",
          className
        )}
        {...rest}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
