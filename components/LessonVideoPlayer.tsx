"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import VideoPlayer from "@/components/VideoPlayer";
import type { MuxStatus } from "@/lib/types";

interface LessonVideoPlayerProps {
  lessonId: string;
  initialStatus: MuxStatus;
  initialPlaybackId: string | null;
  initialPlaybackToken: string | null;
  startTimeSeconds: number;
  onTimeUpdate: (sec: number) => void;
  onEnded: () => void;
}

async function fetchPlaybackToken(
  lessonId: string,
  playbackId: string
): Promise<string | null> {
  const res = await fetch(
    `/api/mux/playback-token?lessonId=${encodeURIComponent(lessonId)}&playbackId=${encodeURIComponent(playbackId)}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { token?: string };
  return data.token ?? null;
}

export default function LessonVideoPlayer({
  lessonId,
  initialStatus,
  initialPlaybackId,
  initialPlaybackToken,
  startTimeSeconds,
  onTimeUpdate,
  onEnded,
}: LessonVideoPlayerProps) {
  const router = useRouter();
  const [muxStatus, setMuxStatus] = React.useState(initialStatus);
  const [playbackId, setPlaybackId] = React.useState(initialPlaybackId);
  const [playbackToken, setPlaybackToken] = React.useState(
    initialPlaybackToken
  );

  React.useEffect(() => {
    setMuxStatus(initialStatus);
    setPlaybackId(initialPlaybackId);
    setPlaybackToken(initialPlaybackToken);
  }, [initialStatus, initialPlaybackId, initialPlaybackToken]);

  const syncFromMux = React.useCallback(async () => {
    const res = await fetch("/api/mux/sync-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      mux_status: MuxStatus;
      mux_playback_id: string | null;
      changed?: boolean;
    };
    setMuxStatus(data.mux_status);
    if (data.mux_playback_id) setPlaybackId(data.mux_playback_id);
    if (data.changed) router.refresh();
    return data;
  }, [lessonId, router]);

  React.useEffect(() => {
    if (muxStatus === "ready" || muxStatus === "errored") return;

    void syncFromMux();
    const interval = window.setInterval(() => {
      void syncFromMux();
    }, 12_000);

    const supabase = createClient();
    const channel = supabase
      .channel(`lesson-video:${lessonId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lessons",
          filter: `id=eq.${lessonId}`,
        },
        (payload) => {
          const row = payload.new as {
            mux_status?: MuxStatus;
            mux_playback_id?: string | null;
          };
          if (row.mux_status) setMuxStatus(row.mux_status);
          if (row.mux_playback_id) setPlaybackId(row.mux_playback_id);
          if (row.mux_status === "ready" || row.mux_status === "errored") {
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [lessonId, muxStatus, router, syncFromMux]);

  React.useEffect(() => {
    if (muxStatus !== "ready" || !playbackId || playbackToken) return;
    let cancelled = false;
    void fetchPlaybackToken(lessonId, playbackId).then((token) => {
      if (!cancelled && token) setPlaybackToken(token);
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId, muxStatus, playbackId, playbackToken]);

  if (muxStatus === "ready" && playbackId && playbackToken) {
    return (
      <div className="sticky top-14 lg:top-0 z-10 bg-black w-full lg:relative">
        <VideoPlayer
          playbackId={playbackId}
          token={playbackToken}
          startTimeSeconds={startTimeSeconds || undefined}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-black/90 grid place-items-center text-white text-sm px-6 text-center max-w-2xl mx-auto leading-snug">
      {muxStatus === "errored" ? (
        "Video failed to process. Please contact your admin."
      ) : muxStatus === "ready" && !playbackId ? (
        <>
          Mux reported the video as ready, but no playback ID was stored. Ask an
          admin to confirm the webhook URL and signing environment, then re-upload
          the file if needed.
        </>
      ) : muxStatus === "ready" && playbackId && !playbackToken ? (
        <>
          Playback is configured, but a signed token could not be created. Ensure{" "}
          <code className="text-xs bg-white/10 px-1 rounded">MUX_SIGNING_KEY_ID</code>{" "}
          and{" "}
          <code className="text-xs bg-white/10 px-1 rounded">
            MUX_SIGNING_PRIVATE_KEY
          </code>{" "}
          are set correctly on the server.
        </>
      ) : (
        <span className="flex flex-col items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white/70 animate-pulse" />
          Video is still processing — this usually takes 1–3 minutes.
        </span>
      )}
    </div>
  );
}
