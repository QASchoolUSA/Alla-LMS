import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signLessonMaterialUrl } from "@/lib/materials";
import { profileMatchesRole } from "@/lib/roles";

interface Ctx {
  params: Promise<{ lessonId: string }>;
}

/**
 * Returns a short-lived signed Supabase Storage URL for a lesson's PDF
 * material — only when the caller is enrolled (or admin).
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { lessonId } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, course_id, material_storage_path")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || !lesson.material_storage_path) {
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

  const url = await signLessonMaterialUrl(lesson.material_storage_path);
  if (!url) {
    return NextResponse.json({ error: "Could not sign URL" }, { status: 500 });
  }

  return NextResponse.json({ url });
}
