import * as React from "react";
import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...rest }: DivProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]",
        className
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: DivProps) {
  return <div className={cn("p-5 pb-3", className)} {...rest} />;
}

export function CardTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-[#1a1916]", className)}
      {...rest}
    />
  );
}

export function CardBody({ className, ...rest }: DivProps) {
  return <div className={cn("p-5 pt-3", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: DivProps) {
  return (
    <div
      className={cn(
        "p-5 pt-3 border-t border-black/[0.06] flex items-center gap-3",
        className
      )}
      {...rest}
    />
  );
}
