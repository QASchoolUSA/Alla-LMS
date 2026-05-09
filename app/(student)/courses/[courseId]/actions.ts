"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function enrollAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) return;

  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("enrollments")
    .upsert(
      { user_id: user.id, course_id: courseId },
      { onConflict: "user_id,course_id" }
    );

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}
