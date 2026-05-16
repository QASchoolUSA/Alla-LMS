"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";

interface LessonMaterialSectionProps {
  lessonId: string;
  initialSignedUrl: string | null;
  hasMaterial: boolean;
}

export default function LessonMaterialSection({
  lessonId,
  initialSignedUrl,
  hasMaterial,
}: LessonMaterialSectionProps) {
  const [signedUrl, setSignedUrl] = React.useState(initialSignedUrl);
  const [loading, setLoading] = React.useState(
    hasMaterial && !initialSignedUrl
  );
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setSignedUrl(initialSignedUrl);
    setError(false);
    setLoading(hasMaterial && !initialSignedUrl);
  }, [initialSignedUrl, hasMaterial, lessonId]);

  React.useEffect(() => {
    if (!hasMaterial || signedUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    void fetch(`/api/materials/${lessonId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as { url?: string };
        if (!data.url) throw new Error("missing url");
        if (!cancelled) setSignedUrl(data.url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasMaterial, lessonId, signedUrl]);

  if (!hasMaterial) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-[#6b6a66]">
        <FileText size={16} />
        <span className="font-medium">Course material</span>
      </div>
      {signedUrl ? (
        <PdfViewer signedUrl={signedUrl} />
      ) : loading ? (
        <div className="rounded-xl border border-black/[0.06] bg-white py-16 text-center text-sm text-[#6b6a66]">
          Loading PDF…
        </div>
      ) : (
        <div className="rounded-xl border border-[#c0392b]/20 bg-[#c0392b]/5 py-10 px-6 text-center text-sm text-[#c0392b]">
          {error
            ? "Could not load this PDF. Try refreshing the page."
            : "PDF is attached but could not be loaded."}
        </div>
      )}
    </section>
  );
}
