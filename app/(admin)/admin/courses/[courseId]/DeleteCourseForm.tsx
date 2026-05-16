"use client";

import * as React from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteCourseAction } from "../actions";

interface DeleteCourseFormProps {
  courseId: string;
  courseTitle: string;
}

export function DeleteCourseForm({
  courseId,
  courseTitle,
}: DeleteCourseFormProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, pending]);

  function handleConfirm() {
    const form = formRef.current;
    if (!form) return;
    startTransition(() => {
      void deleteCourseAction(new FormData(form));
    });
  }

  return (
    <>
      <p className="text-sm font-medium text-[#1a1916] mb-1">Danger zone</p>
      <p className="text-xs text-[#6b6a66] mb-3">
        Deleting a course removes all lessons and student progress.
      </p>
      <Button
        type="button"
        variant="danger"
        fullWidth
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={14} /> Delete course
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/40"
            disabled={pending}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-course-title"
            className="relative w-full max-w-md rounded-xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          >
            <button
              type="button"
              aria-label="Close"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-[#6b6a66] hover:bg-black/[0.04] hover:text-[#1a1916] disabled:opacity-50"
            >
              <X size={18} />
            </button>
            <h2
              id="delete-course-title"
              className="pr-8 text-base font-semibold text-[#1a1916]"
            >
              Delete course?
            </h2>
            <p className="mt-2 text-sm text-[#6b6a66]">
              <span className="font-medium text-[#1a1916]">{courseTitle}</span>{" "}
              and all of its lessons will be permanently removed. Student
              progress for this course cannot be recovered.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={pending}
                onClick={handleConfirm}
              >
                <Trash2 size={14} /> Delete course
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <form ref={formRef} className="hidden" aria-hidden>
        <input type="hidden" name="id" value={courseId} />
      </form>
    </>
  );
}
