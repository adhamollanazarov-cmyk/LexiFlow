"use client";

import { useEffect, useState } from "react";

type DOCXViewerProps = {
  file: File;
};

export function DOCXViewer({ file }: DOCXViewerProps) {
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function convertDocx() {
      setIsLoading(true);
      setHasError(false);
      setHtmlContent("");

      try {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });

        if (isMounted) {
          setHtmlContent(result.value);
        }
      } catch {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    convertDocx();

    return () => {
      isMounted = false;
    };
  }, [file]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl rounded-md bg-white p-4 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 sm:p-8">
        Loading document...
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="mx-auto max-w-4xl rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Could not load this DOCX. Please try another file.
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl overflow-x-hidden rounded-md bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200 sm:p-8 sm:text-base">
      <div
        className="prose prose-slate max-w-none text-sm sm:text-base"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </article>
  );
}
