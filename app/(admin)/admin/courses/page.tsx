import Link from "next/link";
import Image from "next/image";
import { Plus, BookOpen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default async function AdminCoursesPage() {
  await requireUser("admin");
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: lessonRows } = await supabase
    .from("lessons")
    .select("course_id");

  const lessonCounts = new Map<string, number>();
  for (const r of lessonRows ?? []) {
    lessonCounts.set(
      r.course_id as string,
      (lessonCounts.get(r.course_id as string) ?? 0) + 1
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-[#1a1916]">
            Courses
          </h1>
          <p className="mt-1 text-sm text-[#6b6a66]">
            Create, publish, and manage your courses.
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <Plus size={16} /> New course
          </Button>
        </Link>
      </header>

      {(courses ?? []).length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No courses yet"
          description="Create your first course to get started."
          action={
            <Link href="/admin/courses/new">
              <Button>
                <Plus size={16} /> Create course
              </Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-black/[0.05]">
            {(courses ?? []).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/courses/${c.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-black/[0.02] transition-colors"
                >
                  <div className="relative w-20 h-12 rounded-md overflow-hidden bg-[#ece8e2] shrink-0">
                    {c.thumbnail_url ? (
                      <Image
                        src={c.thumbnail_url}
                        alt={c.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-[#b0afab]">
                        <BookOpen size={16} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#1a1916] truncate">
                        {c.title}
                      </p>
                      {c.published ? (
                        <Badge tone="success">Published</Badge>
                      ) : (
                        <Badge tone="neutral">Draft</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#6b6a66] mt-0.5">
                      {lessonCounts.get(c.id) ?? 0} lessons · created{" "}
                      {formatDate(c.created_at)}
                    </p>
                  </div>
                  <span className="text-xs text-[#01696f] font-medium hidden sm:inline">
                    Edit →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
