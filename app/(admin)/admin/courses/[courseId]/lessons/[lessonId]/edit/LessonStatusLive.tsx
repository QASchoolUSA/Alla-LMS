"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import type { MuxStatus } from "@/lib/types";

interface Props {
  lessonId: string;
  initialStatus: MuxStatus;
}

export function LessonStatusLive({ lessonId, initialStatus }: Props) {
  const [status, setStatus] = React.useState<MuxStatus>(initialStatus);
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`lesson:${lessonId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lessons",
          filter: `id=eq.${lessonId}`,
        },
        (payload) => {
          const next = (payload.new as { mux_status?: MuxStatus }).mux_status;
          if (next) {
            setStatus(next);
            // refresh server data so other UI (uploader badge) updates too
            if (next === "ready" || next === "errored") router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [lessonId, router]);

  if (status === "ready") return <Badge tone="success">Video ready</Badge>;
  if (status === "errored") return <Badge tone="error">Video error</Badge>;
  if (status === "preparing") return <Badge tone="warning">Processing…</Badge>;
  return <Badge tone="neutral">No video yet</Badge>;
}
