"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MuxUploader from "@mux/mux-uploader-react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadVideoFormProps {
  lessonId: string;
  initialStatus?: "waiting" | "preparing" | "ready" | "errored" | null;
  onUploaded?: (uploadId: string) => void;
}

type UiState = "idle" | "uploading" | "processing" | "ready" | "error";

export default function UploadVideoForm({
  lessonId,
  initialStatus,
  onUploaded,
}: UploadVideoFormProps) {
  const router = useRouter();
  const [progress, setProgress] = React.useState(0);
  const [endpoint, setEndpoint] = React.useState<string | null>(null);
  const [uploadId, setUploadId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [state, setState] = React.useState<UiState>(
    initialStatus === "ready"
      ? "ready"
      : initialStatus === "errored"
      ? "error"
      : initialStatus === "preparing" || initialStatus === "waiting"
      ? "processing"
      : "idle"
  );

  const fetchUploadUrl = React.useCallback(async (): Promise<string> => {
    setErrorMsg(null);
    const res = await fetch("/api/mux/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "Could not start upload");
      throw new Error(text);
    }
    const data = (await res.json()) as { url: string; uploadId: string };
    setEndpoint(data.url);
    setUploadId(data.uploadId);
    onUploaded?.(data.uploadId);
    return data.url;
  }, [lessonId, onUploaded]);

  React.useEffect(() => {
    if (state !== "processing") return;

    const sync = async () => {
      try {
        const res = await fetch("/api/mux/sync-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { mux_status?: string };
        if (data.mux_status === "ready") {
          setState("ready");
          router.refresh();
        } else if (data.mux_status === "errored") {
          setState("error");
          setErrorMsg("Video processing failed.");
          router.refresh();
        }
      } catch {
        // ignore transient sync errors
      }
    };

    void sync();
    const interval = window.setInterval(() => void sync(), 12_000);
    return () => window.clearInterval(interval);
  }, [state, lessonId, router]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[#1a1916]">Lesson video</p>

      {state === "ready" ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#437a22]/10 text-[#437a22] text-sm">
          <CheckCircle2 size={18} />
          <span className="font-medium">Video is ready to play.</span>
        </div>
      ) : null}

      {state === "processing" ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#b8761b]/10 text-[#b8761b] text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-[#b8761b] animate-pulse" />
          <span className="font-medium">
            Mux is processing your video — this usually takes 1–3 minutes.
          </span>
        </div>
      ) : null}

      {state === "error" || errorMsg ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#c0392b]/10 text-[#c0392b] text-sm">
          <AlertCircle size={18} />
          <span>{errorMsg ?? "Upload failed. Please try again."}</span>
        </div>
      ) : null}

      <MuxUploader
        endpoint={fetchUploadUrl}
        onUploadStart={() => {
          setState("uploading");
          setProgress(0);
        }}
        onProgress={(e) => {
          const detail = (e as CustomEvent<number>).detail;
          if (typeof detail === "number") setProgress(Math.round(detail));
        }}
        onSuccess={() => {
          setProgress(100);
          setState("processing");
        }}
        onUploadError={(e) => {
          const detail = (e as CustomEvent).detail as { message?: string };
          setErrorMsg(detail?.message ?? "Upload failed.");
          setState("error");
        }}
        className={cn(
          "block w-full rounded-xl border border-dashed border-black/15 bg-[#fafaf7] p-8 text-center cursor-pointer hover:border-[#01696f]/50 hover:bg-white transition-colors",
          "[&::part(button)]:hidden"
        )}
        style={{ ["--button-background-color" as string]: "#01696f" }}
      >
        <span slot="heading" className="block text-sm font-semibold text-[#1a1916]">
          <span className="inline-flex items-center gap-2">
            <UploadCloud size={18} />
            Click or drop a video file to upload
          </span>
        </span>
        <span
          slot="separator"
          className="block text-xs text-[#6b6a66] mt-1"
        >
          MP4, MOV, or WebM up to ~10GB
        </span>
      </MuxUploader>

      {state === "uploading" && (
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-black/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#01696f] transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#6b6a66] tabular-nums">
            Uploading… {progress}%
          </p>
        </div>
      )}

      {endpoint && uploadId && state === "processing" && (
        <p className="text-[11px] text-[#b0afab] truncate">
          Upload ID: {uploadId}
        </p>
      )}
    </div>
  );
}
