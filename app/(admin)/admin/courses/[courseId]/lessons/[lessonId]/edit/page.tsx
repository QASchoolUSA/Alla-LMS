import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import {
  updateLessonAction,
  deleteLessonAction,
  uploadMaterialAction,
  removeMaterialAction,
} from "../../../../actions";
import { LessonStatusLive } from "./LessonStatusLive";
import UploadVideoForm from "@/components/UploadVideoForm";

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function EditLessonPage({ params }: PageProps) {
  await requireUser("admin");
  const { courseId, lessonId } = await params;
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={`/admin/courses/${courseId}`}
        className="inline-flex items-center gap-1 text-sm text-[#6b6a66] hover:text-[#1a1916]"
      >
        <ArrowLeft size={16} /> Back to course
      </Link>

      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-[#1a1916] truncate">
            Edit lesson
          </h1>
          <p className="mt-1 text-sm text-[#6b6a66]">
            Add a video, attach a PDF, and choose where the material appears.
          </p>
        </div>
        <LessonStatusLive lessonId={lesson.id} initialStatus={lesson.mux_status} />
      </header>

      {/* Video */}
      <Card className="p-5 md:p-6">
        <UploadVideoForm
          lessonId={lesson.id}
          initialStatus={lesson.mux_status}
        />
      </Card>

      {/* Lesson details */}
      <Card className="p-5 md:p-6">
        <form action={updateLessonAction} className="space-y-5">
          <input type="hidden" name="id" value={lesson.id} />
          <input type="hidden" name="courseId" value={courseId} />

          <Input label="Title" name="title" defaultValue={lesson.title} required />
          <Textarea
            label="Description"
            name="description"
            rows={3}
            defaultValue={lesson.description ?? ""}
          />
          <Input
            label="Position"
            name="position"
            type="number"
            min={1}
            defaultValue={lesson.position}
          />

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[#1a1916]">
              Material display position
            </legend>
            <div className="inline-flex rounded-lg border border-black/10 bg-white overflow-hidden">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="material_display_position"
                  value="before"
                  defaultChecked={lesson.material_display_position === "before"}
                  className="peer sr-only"
                />
                <span className="block px-4 py-2 text-sm font-medium text-[#6b6a66] peer-checked:bg-[#01696f] peer-checked:text-white transition-colors min-w-[140px] text-center">
                  Show before video
                </span>
              </label>
              <label className="cursor-pointer border-l border-black/10">
                <input
                  type="radio"
                  name="material_display_position"
                  value="after"
                  defaultChecked={lesson.material_display_position !== "before"}
                  className="peer sr-only"
                />
                <span className="block px-4 py-2 text-sm font-medium text-[#6b6a66] peer-checked:bg-[#01696f] peer-checked:text-white transition-colors min-w-[140px] text-center">
                  Show after video
                </span>
              </label>
            </div>
          </fieldset>

          <Button type="submit" fullWidth>
            Save lesson
          </Button>
        </form>
      </Card>

      {/* PDF Material */}
      <Card className="p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1916]">
          <FileText size={18} />
          PDF material
        </div>

        {lesson.material_storage_path ? (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-black/10 bg-[#fafaf7]">
            <div className="min-w-0 flex items-center gap-3">
              <FileText size={18} className="text-[#01696f] shrink-0" />
              <span className="text-sm text-[#1a1916] truncate">
                {lesson.material_storage_path.split("/").pop()}
              </span>
            </div>
            <form action={removeMaterialAction}>
              <input type="hidden" name="lessonId" value={lesson.id} />
              <input type="hidden" name="courseId" value={courseId} />
              <input
                type="hidden"
                name="path"
                value={lesson.material_storage_path}
              />
              <Button type="submit" variant="ghost" size="sm">
                <Trash2 size={14} /> Remove
              </Button>
            </form>
          </div>
        ) : (
          <p className="text-xs text-[#6b6a66]">
            No PDF attached. Upload a file below.
          </p>
        )}

        <form
          action={uploadMaterialAction}
          encType="multipart/form-data"
          className="flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="courseId" value={courseId} />
          <label className="block flex-1">
            <span className="block text-sm font-medium text-[#1a1916] mb-1.5">
              Choose PDF
            </span>
            <input
              name="file"
              type="file"
              accept="application/pdf"
              required
              className="block w-full text-sm text-[#1a1916] file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-[#01696f] file:text-white file:font-medium file:cursor-pointer"
            />
          </label>
          <Button type="submit" variant="secondary">
            Upload PDF
          </Button>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="p-5">
        <form action={deleteLessonAction}>
          <input type="hidden" name="id" value={lesson.id} />
          <input type="hidden" name="courseId" value={courseId} />
          <p className="text-sm font-medium text-[#1a1916] mb-1">Delete lesson</p>
          <p className="text-xs text-[#6b6a66] mb-3">
            This permanently removes the lesson, video reference, and progress
            data.
          </p>
          <Button type="submit" variant="danger" size="sm">
            <Trash2 size={14} /> Delete lesson
          </Button>
        </form>
      </Card>
    </div>
  );
}
