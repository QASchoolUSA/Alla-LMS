import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Lock, BookOpen, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCourseDetail } from "@/lib/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { enrollAction } from "./actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseOverviewPage({ params }: PageProps) {
  const { courseId } = await params;
  const user = await requireUser();
  const { course, lessons, progress, enrolled } = await getCourseDetail(
    courseId,
    user.id
  );

  if (!course) notFound();

  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.lesson_id)
  );
  const completedCount = lessons.filter((l) => completedSet.has(l.id)).length;
  const pct = lessons.length === 0 ? 0 : Math.round((completedCount / lessons.length) * 100);
  const lessonsWithMaterials = lessons.filter((l) => l.material_storage_path);

  return (
    <article className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="relative aspect-video w-full max-h-[320px] rounded-xl overflow-hidden bg-[#ece8e2] border border-black/[0.06]">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[#b0afab]">
            <BookOpen size={42} />
          </div>
        )}
      </div>

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#1a1916]">{course.title}</h1>
            <p className="mt-1 text-sm text-[#6b6a66]">
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            </p>
          </div>
          {enrolled ? (
            <Badge tone="success">Enrolled</Badge>
          ) : (
            <Badge tone="primary">Available</Badge>
          )}
        </div>
        {course.description && (
          <p className="text-[15px] leading-relaxed text-[#1a1916]/80 whitespace-pre-line">
            {course.description}
          </p>
        )}
        {enrolled && lessons.length > 0 && (
          <div className="pt-2">
            <ProgressBar value={pct} showLabel />
          </div>
        )}
      </header>

      {!enrolled ? (
        <form action={enrollAction}>
          <input type="hidden" name="courseId" value={course.id} />
          <Button type="submit" fullWidth size="lg">
            Enroll for free
          </Button>
        </form>
      ) : lessons[0] ? (
        <Link href={`/courses/${course.id}/lessons/${lessons[0].id}`}>
          <Button fullWidth size="lg">
            {completedCount === 0 ? "Start course" : "Continue learning"}
          </Button>
        </Link>
      ) : null}

      {enrolled && lessonsWithMaterials.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b6a66]">
            Course materials
          </h2>
          <ul className="rounded-xl border border-black/[0.06] bg-white overflow-hidden divide-y divide-black/[0.04]">
            {lessonsWithMaterials.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/courses/${course.id}/lessons/${l.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#01696f]/[0.04] transition-colors"
                >
                  <FileText size={18} className="text-[#01696f] shrink-0" />
                  <span className="flex-1 text-sm font-medium text-[#1a1916] truncate">
                    {l.title}
                  </span>
                  <span className="text-xs text-[#6b6a66] shrink-0">PDF</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b6a66]">
          Lessons
        </h2>
        <ol className="rounded-xl border border-black/[0.06] bg-white overflow-hidden divide-y divide-black/[0.04]">
          {lessons.length === 0 && (
            <li className="px-4 py-6 text-sm text-[#6b6a66]">
              No lessons published yet.
            </li>
          )}
          {lessons.map((l, i) => {
            const completed = completedSet.has(l.id);
            const locked = !enrolled;
            const inner = (
              <div
                className={cn(
                  "h-14 flex items-center gap-4 px-4 transition-colors",
                  i % 2 === 1 && "bg-[#fafaf7]",
                  !locked && "hover:bg-[#01696f]/[0.04]"
                )}
              >
                <span className="w-7 text-sm text-[#6b6a66] tabular-nums shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm text-[#1a1916] truncate">
                  {l.title}
                </span>
                {!locked && l.material_storage_path ? (
                  <FileText
                    size={16}
                    className="text-[#01696f] shrink-0"
                    aria-label="Includes PDF material"
                  />
                ) : null}
                {locked ? (
                  <Lock size={18} className="text-[#b0afab]" />
                ) : completed ? (
                  <CheckCircle2 size={18} className="text-[#437a22]" />
                ) : (
                  <Circle size={18} className="text-[#b0afab]" />
                )}
              </div>
            );

            return (
              <li key={l.id}>
                {locked ? (
                  inner
                ) : (
                  <Link href={`/courses/${course.id}/lessons/${l.id}`}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </article>
  );
}
