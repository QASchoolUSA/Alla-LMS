import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyMuxWebhook } from "@/lib/mux";

export const runtime = "nodejs";

interface MuxAsset {
  id: string;
  upload_id?: string;
  passthrough?: string;
  status?: string;
  playback_ids?: Array<{ id: string; policy: string }>;
}

interface MuxEvent {
  type: string;
  data: MuxAsset;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("mux-signature");
  if (!verifyMuxWebhook(raw, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: MuxEvent;
  try {
    event = JSON.parse(raw) as MuxEvent;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const asset = event.data;
  if (!asset?.id) return NextResponse.json({ ok: true });

  const supabase = createServiceClient();

  // Prefer `passthrough` (set on direct uploads) so we always correlate the asset
  // to a lesson row even if upload_id shape differs between API versions.
  async function findLessonId(): Promise<string | null> {
    const pass = asset.passthrough?.trim();
    if (
      pass &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pass)
    ) {
      const { data } = await supabase
        .from("lessons")
        .select("id")
        .eq("id", pass)
        .maybeSingle();
      if (data) return (data as { id: string }).id;
    }
    if (asset.upload_id) {
      const { data } = await supabase
        .from("lessons")
        .select("id")
        .eq("mux_upload_id", asset.upload_id)
        .maybeSingle();
      if (data) return (data as { id: string }).id;
    }
    const { data } = await supabase
      .from("lessons")
      .select("id")
      .eq("mux_asset_id", asset.id)
      .maybeSingle();
    return (data as { id: string } | null)?.id ?? null;
  }

  const lessonId = await findLessonId();
  if (!lessonId) return NextResponse.json({ ok: true, note: "lesson not found" });

  const shouldRevalidate =
    event.type === "video.asset.created" ||
    event.type === "video.asset.ready" ||
    event.type === "video.asset.errored" ||
    event.type === "video.upload.errored";

  switch (event.type) {
    case "video.asset.created":
      await supabase
        .from("lessons")
        .update({ mux_asset_id: asset.id, mux_status: "preparing" })
        .eq("id", lessonId);
      break;

    case "video.asset.ready": {
      const ids = asset.playback_ids ?? [];
      const signed = ids.find((p) => p.policy === "signed");
      const playbackId =
        signed?.id ?? (ids.length === 1 ? ids[0]?.id ?? null : null);
      await supabase
        .from("lessons")
        .update({
          mux_asset_id: asset.id,
          mux_playback_id: playbackId,
          mux_status: "ready",
        })
        .eq("id", lessonId);
      break;
    }

    case "video.asset.errored":
    case "video.upload.errored":
      await supabase
        .from("lessons")
        .update({ mux_status: "errored" })
        .eq("id", lessonId);
      break;

    default:
      // ignore other events
      break;
  }

  if (shouldRevalidate) {
    const { data: row } = await supabase
      .from("lessons")
      .select("course_id")
      .eq("id", lessonId)
      .maybeSingle();
    const courseId = (row as { course_id: string } | null)?.course_id;
    if (courseId) {
      revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
      revalidatePath(`/courses/${courseId}`);
    }
  }

  return NextResponse.json({ ok: true });
}
