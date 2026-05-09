import Link from "next/link";
import { BookOpen, Users, PlayCircle, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  await requireUser("admin");
  const supabase = await createClient();

  const [
    { count: courseCount },
    { count: lessonCount },
    { count: studentCount },
    { count: publishedCount },
    { data: recentEnrollments },
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student"),
    supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
    // No FK enrollments.user_id → profiles(id), so `profiles(...)` embed fails PostgREST.
    supabase
      .from("enrollments")
      .select("id, enrolled_at, course_id, user_id, courses(title)")
      .order("enrolled_at", { ascending: false })
      .limit(8),
  ]);

  const userIds = Array.from(
    new Set((recentEnrollments ?? []).map((e) => e.user_id as string))
  ).filter(Boolean);

  const nameByUserId: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      nameByUserId[p.id as string] = (p.full_name as string | null) ?? null;
    }
  }

  const stats = [
    {
      label: "Total courses",
      value: courseCount ?? 0,
      icon: BookOpen,
    },
    {
      label: "Published",
      value: publishedCount ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "Total lessons",
      value: lessonCount ?? 0,
      icon: PlayCircle,
    },
    {
      label: "Students",
      value: studentCount ?? 0,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl md:text-2xl font-semibold text-[#1a1916]">
          Admin overview
        </h1>
        <p className="mt-1 text-sm text-[#6b6a66]">
          A snapshot of activity across your LMS.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-[#1a1916] tabular-nums">
                  {value}
                </p>
                <p className="mt-1 text-sm text-[#6b6a66]">{label}</p>
              </div>
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-[#01696f]/8 text-[#01696f]">
                <Icon size={18} />
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b6a66]">
            Recent enrollments
          </h2>
          <Link
            href="/admin/students"
            className="text-sm font-medium text-[#01696f] hover:underline"
          >
            View students
          </Link>
        </div>
        <Card className="overflow-hidden">
          {(recentEnrollments ?? []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#6b6a66]">
              No enrollments yet.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.04]">
              {(recentEnrollments ?? []).map((row) => {
                const displayName =
                  nameByUserId[row.user_id as string] ?? "Student";
                return (
                  <li
                    key={row.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Avatar name={displayName} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1a1916] truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-[#6b6a66] truncate">
                        Enrolled in{" "}
                        {(row.courses as { title?: string } | null)?.title ??
                          "Course"}
                      </p>
                    </div>
                    <span className="text-xs text-[#6b6a66]">
                      {formatDate(row.enrolled_at as string)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
