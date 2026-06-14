"use client";

import { MouseEvent, TouchEvent, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const INITIAL_VISIBLE_PAGES = 3;
const PAGES_PER_BATCH = 3;

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

type WordRange = {
  word: string;
  range: Range;
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

function getWordRangeFromPoint(x: number, y: number): WordRange | null {
  const range = getRangeFromPoint(x, y);
  const textNode = range?.startContainer;

  if (!range || !textNode || textNode.nodeType !== Node.TEXT_NODE) {
    return null;
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

  const word = text.slice(start, end).trim();

  if (!word) {
    return null;
  }

  const wordRange = document.createRange();
  wordRange.setStart(textNode, start);
  wordRange.setEnd(textNode, end);

  return { word, range: wordRange };
}

function isPointInsideSelection(selection: Selection, x: number, y: number) {
  if (selection.rangeCount === 0) {
    return false;
  }

  const range = selection.getRangeAt(0);

  return Array.from(range.getClientRects()).some(
    (rect) =>
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  );
}

export function PDFViewer({ file, onWordTap }: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [visiblePageCount, setVisiblePageCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    setNumPages(0);
    setVisiblePageCount(0);
    setHasError(false);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  function handleLoadSuccess({ numPages: loadedPages }: PDFLoadSuccess) {
    setNumPages(loadedPages);
    setVisiblePageCount(Math.min(INITIAL_VISIBLE_PAGES, loadedPages));
    setHasError(false);
  }

  function handleLoadError() {
    setHasError(true);
  }

  function handleWordTapAtPoint(x: number, y: number) {
    const wordRange = getWordRangeFromPoint(x, y);

    if (wordRange) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(wordRange.range);
      onWordTap?.({ word: wordRange.word, x, y });
    }
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const selection = window.getSelection();

    if (
      selection?.toString().trim() &&
      isPointInsideSelection(selection, event.clientX, event.clientY)
    ) {
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
  const pagesToRender = Math.min(visiblePageCount, numPages);
  const hasMorePages = pagesToRender < numPages;

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
          {numPages > 0 ? (
            <p className="text-sm text-slate-500">
              Showing {pagesToRender} of {numPages} pages. More pages load only
              when you ask for them.
            </p>
          ) : null}

          {Array.from({ length: pagesToRender }, (_, index) => (
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

          {hasMorePages ? (
            <button
              type="button"
              onClick={() =>
                setVisiblePageCount((currentCount) =>
                  Math.min(currentCount + PAGES_PER_BATCH, numPages)
                )
              }
              className="min-h-11 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Load more pages
            </button>
          ) : null}
        </div>
      </Document>
    </div>
  );
}
