import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { profileMatchesRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { syncLessonMuxFromApi } from "@/lib/mux-lesson-sync";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const lessonId = String(body?.lessonId ?? "");
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, course_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!profileMatchesRole(user.profile.role, "admin")) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", lesson.course_id)
      .maybeSingle();
    if (!enrollment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const synced = await syncLessonMuxFromApi(lessonId);
    if (!synced) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (synced.changed) {
      revalidatePath(`/courses/${lesson.course_id}/lessons/${lessonId}`);
      revalidatePath(`/admin/courses/${lesson.course_id}/lessons/${lessonId}/edit`);
    }

    return NextResponse.json(synced);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not sync lesson from Mux";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
