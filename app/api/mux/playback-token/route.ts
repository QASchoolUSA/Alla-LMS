import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signPlaybackToken } from "@/lib/mux";

/**
 * Issues a short-lived JWT for the given private playback ID,
 * but only if the caller is enrolled in the lesson's parent course
 * (or is an admin).
 */
export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const playbackId = url.searchParams.get("playbackId");
  const lessonId = url.searchParams.get("lessonId");

  if (!playbackId || !lessonId) {
    return NextResponse.json(
      { error: "playbackId and lessonId required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, course_id, mux_playback_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || lesson.mux_playback_id !== playbackId) {
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

  const token = await signPlaybackToken(playbackId);
  return NextResponse.json({ token });
}
