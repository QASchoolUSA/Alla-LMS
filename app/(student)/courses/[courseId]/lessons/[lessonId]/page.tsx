import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCourseDetail } from "@/lib/queries";
import { signPlaybackToken } from "@/lib/mux";
import LessonSidebar from "@/components/LessonSidebar";
import LessonLayout from "@/components/LessonLayout";

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonPlayerPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  const user = await requireUser();
  const { course, lessons, progress, enrolled } = await getCourseDetail(
    courseId,
    user.id
  );

  if (!course) notFound();
  if (!enrolled) redirect(`/courses/${courseId}`);

  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const idx = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = idx > 0 ? lessons[idx - 1] : null;
  const nextLesson = idx < lessons.length - 1 ? lessons[idx + 1] : null;

  const completedLessonIds = progress
    .filter((p) => p.completed)
    .map((p) => p.lesson_id);

  const ownProgress = progress.find((p) => p.lesson_id === lesson.id);
  const startTime = ownProgress?.completed
    ? 0
    : ownProgress?.last_position_seconds ?? 0;

  // Sign playback token only if the asset is ready.
  let playbackToken: string | null = null;
  if (lesson.mux_status === "ready" && lesson.mux_playback_id) {
    try {
      playbackToken = await signPlaybackToken(lesson.mux_playback_id);
    } catch {
      playbackToken = null;
    }
  }

  // Sign material URL via API path (proxied) — but for SSR convenience,
  // generate a short-lived signed URL directly here as well.
  let signedMaterialUrl: string | null = null;
  if (lesson.material_storage_path) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("materials")
      .createSignedUrl(lesson.material_storage_path, 60 * 60);
    signedMaterialUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="flex">
      <div className="flex-1 min-w-0">
        <LessonLayout
          courseId={courseId}
          lesson={lesson}
          playbackToken={playbackToken}
          signedMaterialUrl={signedMaterialUrl}
          startTimeSeconds={startTime}
          prevLessonId={prevLesson?.id ?? null}
          nextLessonId={nextLesson?.id ?? null}
        />
      </div>
      <LessonSidebar
        courseId={courseId}
        courseTitle={course.title}
        lessons={lessons}
        currentLessonId={lesson.id}
        completedLessonIds={completedLessonIds}
        enrolled={enrolled}
      />
    </div>
  );
}
