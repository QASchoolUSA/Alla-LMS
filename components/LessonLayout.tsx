"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import LessonVideoPlayer from "@/components/LessonVideoPlayer";
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
  hasVideoUpload?: boolean;
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
  hasVideoUpload = false,
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

  const videoBlock = (
    <LessonVideoPlayer
      lessonId={lesson.id}
      initialStatus={lesson.mux_status}
      initialPlaybackId={lesson.mux_playback_id}
      initialPlaybackToken={playbackToken}
      startTimeSeconds={startTimeSeconds}
      hasVideoUpload={hasVideoUpload}
      onTimeUpdate={handleTime}
      onEnded={handleEnded}
    />
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
