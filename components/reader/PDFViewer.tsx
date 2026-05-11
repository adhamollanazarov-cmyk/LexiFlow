"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type PDFViewerProps = {
  file: File;
};

type PDFLoadSuccess = {
  numPages: number;
};

export function PDFViewer({ file }: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    setNumPages(0);
    setHasError(false);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  function handleLoadSuccess({ numPages: loadedPages }: PDFLoadSuccess) {
    setNumPages(loadedPages);
    setHasError(false);
  }

  function handleLoadError() {
    setHasError(true);
  }

  if (hasError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Could not load this PDF. Please try another file.
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Loading document...
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Document
        file={fileUrl}
        loading={
          <div className="py-12 text-center text-sm text-slate-500">
            Loading document...
          </div>
        }
        error={
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load this PDF. Please try another file.
          </div>
        }
        onLoadSuccess={handleLoadSuccess}
        onLoadError={handleLoadError}
      >
        <div className="flex flex-col items-center gap-6">
          {Array.from({ length: numPages }, (_, index) => (
            <div
              key={`page-${index + 1}`}
              className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200"
            >
              <Page
                pageNumber={index + 1}
                width={750}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </div>
      </Document>
    </div>
  );
}
