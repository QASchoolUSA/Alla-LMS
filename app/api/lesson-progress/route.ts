import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const lessonId = String(body?.lessonId ?? "");
  const positionSeconds = Math.max(0, Math.floor(Number(body?.positionSeconds ?? 0)));
  const completed = Boolean(body?.completed);

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  const supabase = await createClient();
  await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      last_position_seconds: positionSeconds,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  return NextResponse.json({ ok: true });
}
