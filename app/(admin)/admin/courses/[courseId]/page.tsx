import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Input";
import {
  deleteCourseAction,
  updateCourseAction,
  createLessonAction,
} from "../actions";
import { LessonStatusBadge } from "./LessonStatusBadge";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function AdminCourseDetailPage({ params }: PageProps) {
  await requireUser("admin");
  const { courseId } = await params;
  const supabase = await createClient();

  const [{ data: course }, { data: lessons }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
    supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("position", { ascending: true }),
  ]);

  if (!course) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1 text-sm text-[#6b6a66] hover:text-[#1a1916]"
        >
          <ArrowLeft size={16} /> Courses
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold text-[#1a1916] truncate">
              {course.title}
            </h1>
            <div className="mt-1.5 flex items-center gap-2">
              {course.published ? (
                <Badge tone="success">Published</Badge>
              ) : (
                <Badge tone="neutral">Draft</Badge>
              )}
              <span className="text-xs text-[#6b6a66]">
                {(lessons ?? []).length} lessons
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Lessons */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b6a66]">
              Lessons
            </h2>
          </div>

          <Card className="overflow-hidden">
            {(lessons ?? []).length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#6b6a66]">
                No lessons yet — add the first one below.
              </p>
            ) : (
              <ol className="divide-y divide-black/[0.05]">
                {(lessons ?? []).map((l, i) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/courses/${courseId}/lessons/${l.id}/edit`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors"
                    >
                      <GripVertical
                        size={16}
                        className="text-[#b0afab] shrink-0"
                      />
                      <span className="w-7 text-xs text-[#6b6a66] tabular-nums shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-sm text-[#1a1916] truncate font-medium">
                        {l.title}
                      </span>
                      <LessonStatusBadge status={l.mux_status} />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Quick add lesson */}
          <Card className="p-4">
            <form action={createLessonAction} className="flex gap-2">
              <input type="hidden" name="courseId" value={courseId} />
              <Input
                name="title"
                placeholder="New lesson title"
                required
                className="flex-1"
              />
              <Button type="submit">
                <Plus size={16} /> Add lesson
              </Button>
            </form>
          </Card>
        </section>

        {/* Course settings */}
        <aside className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b6a66]">
            Course settings
          </h2>
          <Card className="p-5">
            <form action={updateCourseAction} className="space-y-4">
              <input type="hidden" name="id" value={course.id} />
              <Input
                label="Title"
                name="title"
                defaultValue={course.title}
                required
              />
              <Textarea
                label="Description"
                name="description"
                defaultValue={course.description ?? ""}
                rows={4}
              />
              <Input
                label="Thumbnail URL"
                name="thumbnail_url"
                type="url"
                defaultValue={course.thumbnail_url ?? ""}
              />
              <label className="flex items-center gap-3 select-none">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={course.published}
                  className="w-5 h-5 rounded border-black/20 text-[#01696f] focus:ring-[#01696f]/30"
                />
                <span className="text-sm text-[#1a1916]">Published</span>
              </label>
              <Button type="submit" fullWidth>
                Save changes
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <form action={deleteCourseAction}>
              <input type="hidden" name="id" value={course.id} />
              <p className="text-sm font-medium text-[#1a1916] mb-1">
                Danger zone
              </p>
              <p className="text-xs text-[#6b6a66] mb-3">
                Deleting a course removes all lessons and student progress.
              </p>
              <Button
                type="submit"
                variant="danger"
                fullWidth
                size="sm"
              >
                <Trash2 size={14} /> Delete course
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}
