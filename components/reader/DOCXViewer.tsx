"use client";

import { MouseEvent, TouchEvent, useEffect, useState } from "react";

type WordTapPayload = {
  word: string;
  x: number;
  y: number;
};

type DOCXViewerProps = {
  file: File;
  onWordTap?: (payload: WordTapPayload) => void;
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

export function DOCXViewer({ file, onWordTap }: DOCXViewerProps) {
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

  function handleWordTapAtPoint(x: number, y: number) {
    const word = getWordFromPoint(x, y);

    if (word) {
      onWordTap?.({ word, x, y });
    }
  }

  function handleClick(event: MouseEvent<HTMLElement>) {
    if (window.getSelection()?.toString().trim()) {
      return;
    }

    handleWordTapAtPoint(event.clientX, event.clientY);
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];

    if (!touch) {
      return;
    }

    event.preventDefault();
    handleWordTapAtPoint(touch.clientX, touch.clientY);
  }

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
    <article
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      className="mx-auto max-w-4xl select-none overflow-x-hidden rounded-md bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200 [-webkit-touch-callout:none] [-webkit-user-select:none] sm:p-8 sm:text-base md:select-text md:[-webkit-user-select:text]"
    >
      <div
        className="prose prose-slate max-w-none text-sm sm:text-base"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </article>
  );
}
