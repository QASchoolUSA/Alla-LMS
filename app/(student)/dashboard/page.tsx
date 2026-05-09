import Link from "next/link";
import { BookOpen, Compass } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listCoursesForStudent } from "@/lib/queries";
import { greeting } from "@/lib/utils";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function StudentDashboard() {
  const user = await requireUser();
  const { enrolled, available } = await listCoursesForStudent(user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-10">
      <header>
        <h1 className="text-xl md:text-2xl font-semibold text-[#1a1916]">
          {greeting(user.profile.full_name)} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-sm text-[#6b6a66]">
          Pick up where you left off, or explore something new.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b6a66]">
            Continue learning
          </h2>
          <Link
            href="/courses"
            className="text-sm font-medium text-[#01696f] hover:underline"
          >
            View all
          </Link>
        </div>

        {enrolled.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="You aren't enrolled in any courses yet"
            description="Browse the catalog and pick something that sparks your interest."
            action={
              <Link href="/courses">
                <Button>Browse courses</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((course) => (
              <CourseCard key={course.id} course={course} variant="continue" />
            ))}
          </div>
        )}
      </section>

      {available.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b6a66]">
              Browse courses
            </h2>
            <span className="hidden md:inline-flex items-center gap-1 text-xs text-[#6b6a66]">
              <Compass size={14} /> {available.length} available
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((course) => (
              <CourseCard key={course.id} course={course} variant="browse" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
