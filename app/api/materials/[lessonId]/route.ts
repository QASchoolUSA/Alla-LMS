import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface Ctx {
  params: Promise<{ lessonId: string }>;
}

/**
 * Returns a short-lived signed Supabase Storage URL for a lesson's PDF
 * material — only when the caller is enrolled (or admin).
 *
 * The PDF itself is never exposed via a public URL.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { lessonId } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, course_id, material_storage_path")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || !lesson.material_storage_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (user.profile.role !== "admin") {
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

  const { data, error } = await supabase.storage
    .from("materials")
    .createSignedUrl(lesson.material_storage_path, 60 * 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Could not sign URL" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
