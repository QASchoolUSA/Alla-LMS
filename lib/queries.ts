import { createClient } from "@/lib/supabase/server";
import type { Course, Lesson, LessonProgress } from "@/lib/types";

export interface CourseWithMeta extends Course {
  lessonCount: number;
  completedCount: number;
  enrolled: boolean;
}

export async function listCoursesForStudent(userId: string): Promise<{
  enrolled: CourseWithMeta[];
  available: CourseWithMeta[];
}> {
  const supabase = await createClient();

  const [{ data: courses }, { data: enrollments }, { data: lessons }, { data: progress }] =
    await Promise.all([
      supabase.from("courses").select("*").eq("published", true).order("created_at", { ascending: false }),
      supabase.from("enrollments").select("course_id").eq("user_id", userId),
      supabase.from("lessons").select("id, course_id"),
      supabase.from("lesson_progress").select("lesson_id, completed").eq("user_id", userId).eq("completed", true),
    ]);

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id));
  const lessonsByCourse = new Map<string, string[]>();
  for (const l of lessons ?? []) {
    const arr = lessonsByCourse.get(l.course_id as string) ?? [];
    arr.push(l.id as string);
    lessonsByCourse.set(l.course_id as string, arr);
  }
  const completedSet = new Set((progress ?? []).map((p) => p.lesson_id as string));

  const decorated: CourseWithMeta[] = (courses ?? []).map((c) => {
    const lessonIds = lessonsByCourse.get(c.id) ?? [];
    return {
      ...c,
      lessonCount: lessonIds.length,
      completedCount: lessonIds.filter((id) => completedSet.has(id)).length,
      enrolled: enrolledIds.has(c.id),
    };
  });

  return {
    enrolled: decorated.filter((c) => c.enrolled),
    available: decorated.filter((c) => !c.enrolled),
  };
}

export async function getCourseDetail(
  courseId: string,
  userId: string
): Promise<{
  course: Course | null;
  lessons: Lesson[];
  progress: LessonProgress[];
  enrolled: boolean;
}> {
  const supabase = await createClient();
  const [{ data: course }, { data: lessons }, { data: progress }, { data: enrollment }] =
    await Promise.all([
      supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
      supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("position", { ascending: true }),
      supabase.from("lesson_progress").select("*").eq("user_id", userId),
      supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle(),
    ]);

  return {
    course: course ?? null,
    lessons: lessons ?? [],
    progress: progress ?? [],
    enrolled: Boolean(enrollment),
  };
}
