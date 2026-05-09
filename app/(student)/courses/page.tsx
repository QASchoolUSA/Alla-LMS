import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listCoursesForStudent } from "@/lib/queries";
import { CourseCard } from "@/components/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default async function MyCoursesPage() {
  const user = await requireUser();
  const { enrolled, available } = await listCoursesForStudent(user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-10">
      <header>
        <h1 className="text-xl md:text-2xl font-semibold text-[#1a1916]">
          My courses
        </h1>
        <p className="mt-1 text-sm text-[#6b6a66]">
          {enrolled.length} enrolled · {available.length} available
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b6a66]">
          Enrolled
        </h2>
        {enrolled.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="No enrolled courses"
            description="Enroll in a course below to start learning."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((c) => (
              <CourseCard key={c.id} course={c} variant="continue" />
            ))}
          </div>
        )}
      </section>

      {available.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b6a66]">
            Available
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((c) => (
              <CourseCard key={c.id} course={c} variant="browse" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
