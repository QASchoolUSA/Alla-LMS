"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import PdfViewer from "@/components/PdfViewer";
import { Button } from "@/components/ui/Button";
import type { Lesson } from "@/lib/types";

interface LessonLayoutProps {
  courseId: string;
  lesson: Lesson;
  playbackToken: string | null;
  signedMaterialUrl: string | null;
  startTimeSeconds: number;
  prevLessonId: string | null;
  nextLessonId: string | null;
}

async function reportProgress(
  lessonId: string,
  positionSeconds: number,
  completed: boolean
) {
  try {
    await fetch("/api/lesson-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        positionSeconds,
        completed,
      }),
      keepalive: true,
    });
  } catch {
    // best effort
  }
}

export default function LessonLayout({
  courseId,
  lesson,
  playbackToken,
  signedMaterialUrl,
  startTimeSeconds,
  prevLessonId,
  nextLessonId,
}: LessonLayoutProps) {
  const handleTime = React.useCallback(
    (sec: number) => {
      void reportProgress(lesson.id, sec, false);
    },
    [lesson.id]
  );

  const handleEnded = React.useCallback(() => {
    void reportProgress(lesson.id, 0, true);
  }, [lesson.id]);

  const showMaterial = Boolean(signedMaterialUrl);
  const materialFirst =
    showMaterial && lesson.material_display_position === "before";

  const videoBlock =
    lesson.mux_status === "ready" && lesson.mux_playback_id && playbackToken ? (
      <div className="sticky top-14 lg:top-0 z-10 bg-black w-full lg:relative">
        <VideoPlayer
          playbackId={lesson.mux_playback_id}
          token={playbackToken}
          startTimeSeconds={startTimeSeconds || undefined}
          onTimeUpdate={handleTime}
          onEnded={handleEnded}
        />
      </div>
    ) : (
      <div className="aspect-video w-full bg-black/90 grid place-items-center text-white text-sm px-6 text-center max-w-2xl mx-auto leading-snug">
        {lesson.mux_status === "errored" ? (
          "Video failed to process. Please contact your admin."
        ) : lesson.mux_status === "ready" && !lesson.mux_playback_id ? (
          <>
            Mux reported the video as ready, but no playback ID was stored. Ask an
            admin to confirm the webhook URL and signing environment, then re-upload
            the file if needed.
          </>
        ) : lesson.mux_status === "ready" &&
          lesson.mux_playback_id &&
          !playbackToken ? (
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
          "Video is still processing — check back in a minute."
        )}
      </div>
    );

  const materialBlock = signedMaterialUrl && (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-[#6b6a66]">
        <FileText size={16} />
        <span className="font-medium">Course material</span>
      </div>
      <PdfViewer signedUrl={signedMaterialUrl} />
    </section>
  );

  return (
    <div className="flex flex-col">
      {materialFirst ? (
        <>
          {videoBlock}
          <div className="px-4 lg:px-8 pt-6 pb-12 max-w-4xl mx-auto w-full space-y-6">
            <header>
              <h1 className="text-xl lg:text-2xl font-bold text-[#1a1916]">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="mt-2 text-sm text-[#6b6a66] leading-relaxed">
                  {lesson.description}
                </p>
              )}
            </header>
            {materialBlock}
            <NavButtons
              courseId={courseId}
              prevLessonId={prevLessonId}
              nextLessonId={nextLessonId}
            />
          </div>
        </>
      ) : (
        <>
          {videoBlock}
          <div className="px-4 lg:px-8 pt-6 pb-12 max-w-4xl mx-auto w-full space-y-6">
            <header>
              <h1 className="text-xl lg:text-2xl font-bold text-[#1a1916]">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="mt-2 text-sm text-[#6b6a66] leading-relaxed">
                  {lesson.description}
                </p>
              )}
            </header>
            {materialBlock}
            <NavButtons
              courseId={courseId}
              prevLessonId={prevLessonId}
              nextLessonId={nextLessonId}
            />
          </div>
        </>
      )}
    </div>
  );
}

function NavButtons({
  courseId,
  prevLessonId,
  nextLessonId,
}: {
  courseId: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
}) {
  return (
    <div className="flex justify-between gap-3 pt-6 border-t border-black/[0.06]">
      {prevLessonId ? (
        <Link href={`/courses/${courseId}/lessons/${prevLessonId}`}>
          <Button variant="secondary">
            <ArrowLeft size={16} /> Previous
          </Button>
        </Link>
      ) : (
        <span />
      )}
      {nextLessonId ? (
        <Link href={`/courses/${courseId}/lessons/${nextLessonId}`}>
          <Button variant="primary">
            Next <ArrowRight size={16} />
          </Button>
        </Link>
      ) : (
        <Link href={`/courses/${courseId}`}>
          <Button variant="primary">Back to course</Button>
        </Link>
      )}
    </div>
  );
}
