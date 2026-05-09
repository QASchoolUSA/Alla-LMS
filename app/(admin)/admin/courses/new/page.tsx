import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { createCourseAction } from "../actions";

export default async function NewCoursePage() {
  await requireUser("admin");

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1 text-sm text-[#6b6a66] hover:text-[#1a1916]"
      >
        <ArrowLeft size={16} /> Courses
      </Link>

      <header>
        <h1 className="text-xl md:text-2xl font-semibold text-[#1a1916]">
          New course
        </h1>
        <p className="mt-1 text-sm text-[#6b6a66]">
          Set up the basics — you can add lessons next.
        </p>
      </header>

      <Card className="p-5 md:p-6">
        <form action={createCourseAction} className="space-y-5">
          <Input
            label="Title"
            name="title"
            placeholder="e.g. Intro to Watercolor"
            required
          />
          <Textarea
            label="Description"
            name="description"
            rows={4}
            placeholder="What will students learn?"
          />
          <Input
            label="Thumbnail URL"
            name="thumbnail_url"
            type="url"
            placeholder="https://…/cover.jpg"
            hint="Use a 16:9 image. You can change this later."
          />
          <label className="flex items-center gap-3 select-none">
            <input
              type="checkbox"
              name="published"
              className="w-5 h-5 rounded border-black/20 text-[#01696f] focus:ring-[#01696f]/30"
            />
            <span className="text-sm text-[#1a1916]">Publish immediately</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/courses">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit">Create course</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
