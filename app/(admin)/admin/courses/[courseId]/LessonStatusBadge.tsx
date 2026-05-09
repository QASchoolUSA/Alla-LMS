import { Badge } from "@/components/ui/Badge";
import type { MuxStatus } from "@/lib/types";

export function LessonStatusBadge({ status }: { status: MuxStatus }) {
  if (status === "ready") return <Badge tone="success">Ready</Badge>;
  if (status === "errored") return <Badge tone="error">Error</Badge>;
  if (status === "preparing") return <Badge tone="warning">Processing</Badge>;
  return <Badge tone="neutral">No video</Badge>;
}
