"use client";

import { MouseEvent, TouchEvent, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type WordTapPayload = {
  word: string;
  x: number;
  y: number;
};

type PDFViewerProps = {
  file: File;
  onWordTap?: (payload: WordTapPayload) => void;
};

type PDFLoadSuccess = {
  numPages: number;
};

function isWordChar(character: string) {
  return /[\p{L}\p{N}'’-]/u.test(character);
}

function getRangeFromPoint(x: number, y: number) {
  const documentWithCaret = document as Document & {
    caretRangeFromPoint?: (pointX: number, pointY: number) => Range | null;
    caretPositionFromPoint?: (
      pointX: number,
      pointY: number
    ) => { offsetNode: Node; offset: number } | null;
  };

  if (documentWithCaret.caretRangeFromPoint) {
    return documentWithCaret.caretRangeFromPoint(x, y);
  }

  const position = documentWithCaret.caretPositionFromPoint?.(x, y);

  if (!position) {
    return null;
  }

  const range = document.createRange();
  range.setStart(position.offsetNode, position.offset);
  range.collapse(true);

  return range;
}

function getWordFromPoint(x: number, y: number) {
  const range = getRangeFromPoint(x, y);
  const textNode = range?.startContainer;

  if (!range || !textNode || textNode.nodeType !== Node.TEXT_NODE) {
    return "";
  }

  const text = textNode.textContent ?? "";
  let start = range.startOffset;
  let end = range.startOffset;

  while (start > 0 && isWordChar(text[start - 1])) {
    start -= 1;
  }

  while (end < text.length && isWordChar(text[end])) {
    end += 1;
  }

  return text.slice(start, end).trim();
}

export function PDFViewer({ file, onWordTap }: PDFViewerProps) {
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

  function handleWordTapAtPoint(x: number, y: number) {
    const word = getWordFromPoint(x, y);

    if (word) {
      onWordTap?.({ word, x, y });
    }
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (window.getSelection()?.toString().trim()) {
      return;
    }

    handleWordTapAtPoint(event.clientX, event.clientY);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];

    if (!touch) {
      return;
    }

    event.preventDefault();
    handleWordTapAtPoint(touch.clientX, touch.clientY);
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

  const pageWidth =
    typeof window === "undefined" ? 750 : Math.min(750, window.innerWidth - 32);

  return (
    <div
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      className="flex max-w-full select-none justify-center overflow-x-hidden [-webkit-touch-callout:none] [-webkit-user-select:none] md:select-text md:[-webkit-user-select:text]"
    >
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
        <div className="flex max-w-full flex-col items-center gap-6">
          {Array.from({ length: numPages }, (_, index) => (
            <div
              key={`page-${index + 1}`}
              className="max-w-full overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200"
            >
              <Page
                pageNumber={index + 1}
                width={pageWidth}
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
