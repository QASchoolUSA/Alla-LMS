"use client";

import * as React from "react";
import MuxPlayer from "@mux/mux-player-react";

interface Props {
  playbackId: string;
  token: string;
  poster?: string;
  startTimeSeconds?: number;
  onEnded?: () => void;
  onTimeUpdate?: (seconds: number) => void;
}

export default function VideoPlayer({
  playbackId,
  token,
  poster,
  startTimeSeconds,
  onEnded,
  onTimeUpdate,
}: Props) {
  const lastSavedRef = React.useRef(0);

  return (
    <MuxPlayer
      playbackId={playbackId}
      tokens={{ playback: token }}
      streamType="on-demand"
      poster={poster}
      startTime={startTimeSeconds}
      nohotkeys={false}
      preload="metadata"
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        "--media-object-fit": "contain",
      }}
      onEnded={onEnded}
      onTimeUpdate={(e: Event) => {
        const v = e.target as HTMLVideoElement;
        const sec = Math.floor(v.currentTime || 0);
        // Throttle: at most once every 5s
        if (Math.abs(sec - lastSavedRef.current) >= 5) {
          lastSavedRef.current = sec;
          onTimeUpdate?.(sec);
        }
      }}
    />
  );
}
