import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMux } from "@/lib/mux";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  await requireUser("admin");

  const body = await req.json().catch(() => ({}));
  const lessonId = String(body?.lessonId ?? "");
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  const origin = req.headers.get("origin");
  const corsOrigin =
    origin && /^https?:\/\//i.test(origin) ? origin : env.appUrl;

  const mux = getMux();
  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policies: ["signed"],
      passthrough: lessonId,
      video_quality: "basic",
      mp4_support: "none",
    },
  });

  // Persist the upload id so we can correlate the webhook later.
  const supabase = await createClient();
  await supabase
    .from("lessons")
    .update({
      mux_upload_id: upload.id,
      mux_status: "waiting",
    })
    .eq("id", lessonId);

  return NextResponse.json({
    uploadId: upload.id,
    url: upload.url,
  });
}
