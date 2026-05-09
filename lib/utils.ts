export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}

export function greeting(name?: string | null): string {
  const hour = new Date().getHours();
  const period =
    hour < 5 ? "evening" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const first = (name ?? "there").split(" ")[0];
  return `Good ${period}, ${first}`;
}

export function initials(name?: string | null, fallback = "U"): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
