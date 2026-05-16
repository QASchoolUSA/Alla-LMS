import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCourseDetail } from "@/lib/queries";
import { signPlaybackToken } from "@/lib/mux-signing";
import { profileMatchesRole } from "@/lib/roles";
import LessonSidebar from "@/components/LessonSidebar";
import LessonLayout from "@/components/LessonLayout";
import type { Lesson } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonPlayerPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  const user = await requireUser();
  const isAdmin = profileMatchesRole(user.profile.role, "admin");
  const { course, lessons, progress, enrolled } = await getCourseDetail(
    courseId,
    user.id
  );

  if (!course) notFound();
  if (!enrolled && !isAdmin) redirect(`/courses/${courseId}`);

  let lesson: Lesson | undefined = lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .maybeSingle();
    lesson = data ?? undefined;
  }
  if (!lesson) notFound();

  const lessonList =
    lessons.some((l) => l.id === lessonId)
      ? lessons
      : [...lessons, lesson].sort((a, b) => a.position - b.position);

  const idx = lessonList.findIndex((l) => l.id === lessonId);
  const prevLesson = idx > 0 ? lessonList[idx - 1] : null;
  const nextLesson =
    idx < lessonList.length - 1 ? lessonList[idx + 1] : null;

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
    try {
      const supabase = await createClient();
      const { data } = await supabase.storage
        .from("materials")
        .createSignedUrl(lesson.material_storage_path, 60 * 60);
      signedMaterialUrl = data?.signedUrl ?? null;
    } catch {
      signedMaterialUrl = null;
    }
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
          hasVideoUpload={Boolean(lesson.mux_upload_id || lesson.mux_asset_id)}
        />
      </div>
      <LessonSidebar
        courseId={courseId}
        courseTitle={course.title}
        lessons={lessonList}
        currentLessonId={lesson.id}
        completedLessonIds={completedLessonIds}
        enrolled={enrolled || isAdmin}
      />
    </div>
  );
}
