import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/** Sign a private materials-bucket path (service role; call only after auth checks). */
export async function signLessonMaterialUrl(
  storagePath: string,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  const service = createServiceClient();
  const { data, error } = await service.storage
    .from("materials")
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
