import { NextResponse } from "next/server";
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

  // The lesson row is keyed by mux_upload_id (set when we created the upload)
  // OR by mux_asset_id (for subsequent updates).
  async function findLessonId(): Promise<string | null> {
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

  switch (event.type) {
    case "video.asset.created":
      await supabase
        .from("lessons")
        .update({ mux_asset_id: asset.id, mux_status: "preparing" })
        .eq("id", lessonId);
      break;

    case "video.asset.ready": {
      const playback = asset.playback_ids?.find((p) => p.policy === "signed");
      await supabase
        .from("lessons")
        .update({
          mux_asset_id: asset.id,
          mux_playback_id: playback?.id ?? null,
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

  return NextResponse.json({ ok: true });
}
