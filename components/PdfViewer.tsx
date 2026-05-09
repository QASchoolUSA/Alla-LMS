"use client";

import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  signedUrl: string;
  className?: string;
}

export default function PdfViewer({ signedUrl, className }: PdfViewerProps) {
  const [numPages, setNumPages] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [width, setWidth] = React.useState<number>(800);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) setWidth(Math.min(w, 1100));
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={
        "w-full overflow-hidden rounded-xl border border-black/[0.06] bg-white " +
        (className ?? "")
      }
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="w-full flex justify-center">
        <Document
          file={signedUrl}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setPageNumber(1);
          }}
          loading={
            <div className="py-16 text-center text-sm text-[#6b6a66]">
              Loading PDF…
            </div>
          }
          error={
            <div className="py-16 text-center text-sm text-[#c0392b]">
              Couldn&apos;t load this PDF.
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={width}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
      </div>

      {numPages > 1 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-black/[0.06]">
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="text-sm font-medium text-[#01696f] disabled:opacity-30 min-h-[44px] px-3"
          >
            ← Prev
          </button>
          <span className="text-sm text-[#6b6a66] tabular-nums">
            Page {pageNumber} of {numPages}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="text-sm font-medium text-[#01696f] disabled:opacity-30 min-h-[44px] px-3"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
