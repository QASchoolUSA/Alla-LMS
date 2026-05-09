"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function createCourseAction(formData: FormData) {
  await requireUser("admin");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const thumbnail_url =
    String(formData.get("thumbnail_url") ?? "").trim() || null;
  const published = formData.get("published") === "on";

  if (!title) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({ title, description, thumbnail_url, published })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create course");

  revalidatePath("/admin/courses");
  revalidatePath("/dashboard");
  redirect(`/admin/courses/${data.id}`);
}

export async function updateCourseAction(formData: FormData) {
  await requireUser("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const thumbnail_url =
    String(formData.get("thumbnail_url") ?? "").trim() || null;
  const published = formData.get("published") === "on";

  const supabase = await createClient();
  await supabase
    .from("courses")
    .update({ title, description, thumbnail_url, published })
    .eq("id", id);

  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/admin/courses");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

export async function deleteCourseAction(formData: FormData) {
  await requireUser("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", id);

  revalidatePath("/admin/courses");
  revalidatePath("/dashboard");
  redirect("/admin/courses");
}

export async function createLessonAction(formData: FormData) {
  await requireUser("admin");
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const positionRaw = formData.get("position");
  const material_display_position =
    String(formData.get("material_display_position") ?? "after") === "before"
      ? "before"
      : "after";

  if (!courseId || !title) return;

  const supabase = await createClient();

  let position = Number(positionRaw ?? 0);
  if (!Number.isFinite(position) || position <= 0) {
    const { count } = await supabase
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId);
    position = (count ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      course_id: courseId,
      title,
      description,
      position,
      material_display_position,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create lesson");

  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}/lessons/${data.id}/edit`);
}

export async function updateLessonAction(formData: FormData) {
  await requireUser("admin");
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id || !courseId) return;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const position = Number(formData.get("position") ?? 0) || 0;
  const material_display_position =
    String(formData.get("material_display_position") ?? "after") === "before"
      ? "before"
      : "after";

  const supabase = await createClient();
  await supabase
    .from("lessons")
    .update({
      title,
      description,
      position,
      material_display_position,
    })
    .eq("id", id);

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/lessons/${id}/edit`);
}

export async function deleteLessonAction(formData: FormData) {
  await requireUser("admin");
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id || !courseId) return;

  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", id);

  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

export async function uploadMaterialAction(formData: FormData) {
  await requireUser("admin");
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const file = formData.get("file") as File | null;
  if (!lessonId || !courseId || !file || file.size === 0) return;

  const ext = file.name.split(".").pop() ?? "pdf";
  const safeName = `material-${Date.now()}.${ext}`;
  const path = `lessons/${lessonId}/${safeName}`;

  // Use service client to bypass RLS for the upload — admin already verified.
  const service = createServiceClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error: upErr } = await service.storage
    .from("materials")
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type || "application/pdf",
      upsert: true,
    });

  if (upErr) throw new Error(upErr.message);

  const supabase = await createClient();
  await supabase
    .from("lessons")
    .update({ material_storage_path: path })
    .eq("id", lessonId);

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}/edit`);
}

export async function removeMaterialAction(formData: FormData) {
  await requireUser("admin");
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const path = String(formData.get("path") ?? "");
  if (!lessonId || !courseId) return;

  if (path) {
    const service = createServiceClient();
    await service.storage.from("materials").remove([path]);
  }
  const supabase = await createClient();
  await supabase
    .from("lessons")
    .update({ material_storage_path: null })
    .eq("id", lessonId);

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}/edit`);
}
