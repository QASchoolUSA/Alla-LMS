import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 32, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-full bg-[#01696f]/12 text-[#01696f] font-semibold uppercase",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.floor(size * 0.4)),
      }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
