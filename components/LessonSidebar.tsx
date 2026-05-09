"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Lock, X, ListVideo } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LessonSidebarProps {
  courseId: string;
  courseTitle: string;
  lessons: Lesson[];
  currentLessonId: string;
  completedLessonIds: Set<string>;
  enrolled: boolean;
}

export default function LessonSidebar({
  courseId,
  courseTitle,
  lessons,
  currentLessonId,
  completedLessonIds,
  enrolled,
}: LessonSidebarProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const list = (
    <ol className="divide-y divide-black/[0.05]">
      {lessons.map((l, i) => {
        const completed = completedLessonIds.has(l.id);
        const active = l.id === currentLessonId;
        const locked = !enrolled;

        const inner = (
          <div
            className={cn(
              "flex items-start gap-3 px-4 py-3 transition-colors",
              active && "bg-[#01696f]/[0.06] border-l-2 border-l-[#01696f]",
              !active && "border-l-2 border-l-transparent",
              !locked && !active && "hover:bg-black/[0.03]"
            )}
          >
            <span className="mt-0.5 shrink-0">
              {locked ? (
                <Lock size={16} className="text-[#b0afab]" />
              ) : completed ? (
                <CheckCircle2 size={18} className="text-[#437a22]" />
              ) : (
                <Circle size={18} className="text-[#b0afab]" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#6b6a66] tabular-nums">
                Lesson {i + 1}
              </p>
              <p
                className={cn(
                  "text-sm leading-snug truncate",
                  active
                    ? "font-semibold text-[#1a1916]"
                    : completed
                    ? "text-[#6b6a66]"
                    : "text-[#1a1916]"
                )}
              >
                {l.title}
              </p>
            </div>
          </div>
        );

        if (locked) {
          return (
            <li key={l.id} className="opacity-60 cursor-not-allowed">
              {inner}
            </li>
          );
        }

        return (
          <li key={l.id}>
            <Link
              href={`/courses/${courseId}/lessons/${l.id}`}
              onClick={() => setOpen(false)}
            >
              {inner}
            </Link>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Mobile floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 px-4 h-12 rounded-full bg-[#01696f] text-white shadow-[0_8px_20px_rgba(1,105,111,0.35)] active:scale-[0.97] transition-transform"
      >
        <ListVideo size={18} />
        <span className="text-sm font-medium">Lessons</span>
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-80 shrink-0 border-l border-black/[0.06] bg-white sticky top-14 h-[calc(100vh-3.5rem)]">
        <div className="px-4 py-4 border-b border-black/[0.06]">
          <p className="text-xs uppercase tracking-wide text-[#6b6a66] font-medium">
            Course
          </p>
          <p className="text-sm font-semibold text-[#1a1916] truncate mt-0.5">
            {courseTitle}
          </p>
        </div>
        <div className="overflow-y-auto flex-1">{list}</div>
      </aside>

      {/* Mobile bottom-sheet */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col animate-[slideUp_180ms_ease-out]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-[#6b6a66] font-medium">
                  Lessons
                </p>
                <p className="text-sm font-semibold text-[#1a1916] truncate">
                  {courseTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-10 h-10 grid place-items-center rounded-full hover:bg-black/[0.05]"
                aria-label="Close lessons"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto pb-6">{list}</div>
          </div>
          <style>{`
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </>
  );
}
