import "server-only";
import { getMux } from "@/lib/mux";
import { createServiceClient } from "@/lib/supabase/server";
import type { MuxStatus } from "@/lib/types";

interface MuxPlaybackRef {
  id: string;
  policy: string;
}

function pickSignedPlaybackId(
  playbackIds: MuxPlaybackRef[] | undefined
): string | null {
  const ids = playbackIds ?? [];
  const signed = ids.find((p) => p.policy === "signed");
  return signed?.id ?? (ids.length === 1 ? ids[0]?.id ?? null : null);
}

export interface SyncedLessonMux {
  mux_status: MuxStatus;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  changed: boolean;
}

/**
 * Pull the latest Mux upload/asset state into `lessons`.
 * Used when webhooks are delayed, misconfigured, or missed.
 */
export async function syncLessonMuxFromApi(
  lessonId: string
): Promise<SyncedLessonMux | null> {
  const supabase = createServiceClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "id, mux_status, mux_playback_id, mux_asset_id, mux_upload_id, course_id"
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) return null;

  if (lesson.mux_status === "ready" && lesson.mux_playback_id) {
    return {
      mux_status: lesson.mux_status as MuxStatus,
      mux_playback_id: lesson.mux_playback_id,
      mux_asset_id: lesson.mux_asset_id,
      changed: false,
    };
  }

  if (!lesson.mux_upload_id && !lesson.mux_asset_id) {
    return {
      mux_status: (lesson.mux_status as MuxStatus) ?? "waiting",
      mux_playback_id: lesson.mux_playback_id,
      mux_asset_id: lesson.mux_asset_id,
      changed: false,
    };
  }

  let mux: ReturnType<typeof getMux>;
  try {
    mux = getMux();
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Mux is not configured on the server"
    );
  }

  let assetId = lesson.mux_asset_id as string | null;

  if (!assetId && lesson.mux_upload_id) {
    let upload;
    try {
      upload = await mux.video.uploads.retrieve(lesson.mux_upload_id);
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? `Mux upload lookup failed: ${err.message}`
          : "Mux upload lookup failed"
      );
    }
    if (
      upload.status === "errored" ||
      upload.status === "cancelled" ||
      upload.status === "timed_out"
    ) {
      await supabase
        .from("lessons")
        .update({ mux_status: "errored" })
        .eq("id", lessonId);
      return {
        mux_status: "errored",
        mux_playback_id: null,
        mux_asset_id: null,
        changed: lesson.mux_status !== "errored",
      };
    }
    assetId = upload.asset_id ?? null;
    if (assetId && lesson.mux_asset_id !== assetId) {
      await supabase
        .from("lessons")
        .update({ mux_asset_id: assetId, mux_status: "preparing" })
        .eq("id", lessonId);
    }
  }

  if (!assetId) {
    return {
      mux_status: (lesson.mux_status as MuxStatus) ?? "waiting",
      mux_playback_id: lesson.mux_playback_id,
      mux_asset_id: lesson.mux_asset_id,
      changed: false,
    };
  }

  let asset;
  try {
    asset = await mux.video.assets.retrieve(assetId);
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `Mux asset lookup failed: ${err.message}`
        : "Mux asset lookup failed"
    );
  }

  if (asset.status === "errored") {
    await supabase
      .from("lessons")
      .update({ mux_status: "errored" })
      .eq("id", lessonId);
    return {
      mux_status: "errored",
      mux_playback_id: null,
      mux_asset_id: assetId,
      changed: lesson.mux_status !== "errored",
    };
  }

  if (asset.status === "ready") {
    const playbackId = pickSignedPlaybackId(
      asset.playback_ids as MuxPlaybackRef[] | undefined
    );
    await supabase
      .from("lessons")
      .update({
        mux_asset_id: asset.id,
        mux_playback_id: playbackId,
        mux_status: "ready",
      })
      .eq("id", lessonId);

    return {
      mux_status: "ready",
      mux_playback_id: playbackId,
      mux_asset_id: asset.id,
      changed: lesson.mux_status !== "ready" || lesson.mux_playback_id !== playbackId,
    };
  }

  if (lesson.mux_status === "waiting") {
    await supabase
      .from("lessons")
      .update({ mux_status: "preparing", mux_asset_id: assetId })
      .eq("id", lessonId);
  }

  return {
    mux_status: "preparing",
    mux_playback_id: null,
    mux_asset_id: assetId,
    changed: lesson.mux_status !== "preparing",
  };
}
