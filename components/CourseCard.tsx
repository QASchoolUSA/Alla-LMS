import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import type { CourseWithMeta } from "@/lib/queries";

interface CourseCardProps {
  course: CourseWithMeta;
  variant?: "continue" | "browse";
}

export function CourseCard({ course, variant = "continue" }: CourseCardProps) {
  const pct =
    course.lessonCount === 0
      ? 0
      : Math.round((course.completedCount / course.lessonCount) * 100);

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#01696f]/40 rounded-xl"
    >
      <Card className="overflow-hidden h-full flex flex-col transition-shadow group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="relative aspect-video w-full bg-[#ece8e2]">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[#b0afab]">
              <BookOpen size={28} />
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-[#1a1916] leading-snug line-clamp-2">
              {course.title}
            </h3>
            <ArrowUpRight
              size={18}
              className="text-[#b0afab] group-hover:text-[#01696f] transition-colors shrink-0"
            />
          </div>
          {course.description && variant === "browse" && (
            <p className="text-sm text-[#6b6a66] line-clamp-2">
              {course.description}
            </p>
          )}
          <div className="mt-auto">
            {variant === "continue" ? (
              <div className="flex items-center justify-between gap-3">
                <ProgressBar value={pct} className="flex-1" />
                <span className="text-xs text-[#6b6a66] tabular-nums shrink-0">
                  {course.completedCount}/{course.lessonCount}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6b6a66]">
                  {course.lessonCount}{" "}
                  {course.lessonCount === 1 ? "lesson" : "lessons"}
                </span>
                <Badge tone="primary">Enroll</Badge>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
