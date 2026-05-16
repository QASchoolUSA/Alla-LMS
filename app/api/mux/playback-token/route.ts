import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signPlaybackToken } from "@/lib/mux-signing";
import { profileMatchesRole } from "@/lib/roles";

/**
 * Issues a short-lived JWT for the given private playback ID,
 * but only if the caller is enrolled in the lesson's parent course
 * (or is an admin).
 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
    const token = await signPlaybackToken(playbackId);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: "Could not sign playback token" },
      { status: 500 }
    );
  }
}
