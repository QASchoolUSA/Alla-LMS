import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0..100
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  className,
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("w-full", className)}>
      <div className="h-1.5 w-full bg-black/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#01696f] rounded-full transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1.5 text-xs text-[#6b6a66] tabular-nums">{clamped}%</p>
      )}
    </div>
  );
}
