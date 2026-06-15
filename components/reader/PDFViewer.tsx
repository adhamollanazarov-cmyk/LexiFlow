"use client";

import {
  MouseEvent,
  TouchEvent,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { trackEvent } from "@/lib/analytics";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const INITIAL_VISIBLE_PAGES = 3;
const PAGES_PER_BATCH = 3;
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;
const FIRST_CHUNK_BYTES = 64 * 1024;
const PROGRESS_KEY_PREFIX = "lexiflow:pdf-progress:v1:";

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

type StoredProgress = {
  page?: number;
  zoom?: number;
};

type SearchMatch = {
  pageNumber: number;
  count: number;
};

type PDFPageViewProps = {
  pageNumber: number;
  pageWidth: number;
  setPageRef: (pageNumber: number, element: HTMLDivElement | null) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isWordChar(character: string) {
  return /[\p{L}\p{N}'-]/u.test(character);
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(text: string, query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return 0;
  }

  const matches = text.match(new RegExp(escapeRegExp(normalizedQuery), "gi"));
  return matches?.length ?? 0;
}

function getStoredProgress(key: string): StoredProgress | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as StoredProgress;
  } catch {
    return null;
  }
}

async function createDocumentFingerprint(file: File) {
  const base = `${file.size}:${file.type}:${file.lastModified}`;

  if (
    typeof window === "undefined" ||
    !window.crypto?.subtle ||
    typeof TextEncoder === "undefined"
  ) {
    return base;
  }

  try {
    const chunk = await file.slice(0, FIRST_CHUNK_BYTES).arrayBuffer();
    const baseBytes = new TextEncoder().encode(base);
    const combined = new Uint8Array(baseBytes.byteLength + chunk.byteLength);
    combined.set(baseBytes, 0);
    combined.set(new Uint8Array(chunk), baseBytes.byteLength);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", combined);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return hash;
  } catch {
    return base;
  }
}

const PDFPageView = memo(function PDFPageView({
  pageNumber,
  pageWidth,
  setPageRef
}: PDFPageViewProps) {
  return (
    <div
      ref={(element) => {
        setPageRef(pageNumber, element);
      }}
      data-page-number={pageNumber}
      className="max-w-full overflow-x-auto rounded-md bg-white shadow-sm ring-1 ring-slate-200"
    >
      <Page
        pageNumber={pageNumber}
        width={pageWidth}
        renderTextLayer={true}
        renderAnnotationLayer={false}
        loading={
          <div
            className="flex animate-pulse items-center justify-center rounded-md bg-slate-100 text-sm font-medium text-slate-400"
            style={{
              width: pageWidth,
              height: Math.round(pageWidth * 1.3)
            }}
          >
            Rendering page {pageNumber}...
          </div>
        }
      />
    </div>
  );
});

export function PDFViewer({ file, onWordTap }: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [visiblePageCount, setVisiblePageCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [progressKey, setProgressKey] = useState("");
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);
  const [restoredPage, setRestoredPage] = useState<number | null>(null);
  const [pendingScrollPage, setPendingScrollPage] = useState<number | null>(
    null
  );
  const [extraPageNumbers, setExtraPageNumbers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [activeSearchMatchIndex, setActiveSearchMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewerWidth, setViewerWidth] = useState(750);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const lastTrackedPageRef = useRef(1);
  const lastTrackedZoomRef = useRef(100);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let frameId = 0;

    function updateViewerWidth() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const measuredWidth =
          viewerContainerRef.current?.clientWidth || window.innerWidth;
        setViewerWidth(measuredWidth);
      });
    }

    updateViewerWidth();
    window.addEventListener("resize", updateViewerWidth);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateViewerWidth);
    };
  }, []);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    let isActive = true;

    setFileUrl(objectUrl);
    setNumPages(0);
    setVisiblePageCount(0);
    setHasError(false);
    setZoom(100);
    setCurrentPage(1);
    setProgressKey("");
    setHasLoadedProgress(false);
    setRestoredPage(null);
    setPendingScrollPage(null);
    setExtraPageNumbers([]);
    setSearchQuery("");
    setSearchMatches([]);
    setActiveSearchMatchIndex(0);
    setIsSearching(false);
    setIsLoadingMore(false);
    pageRefs.current = {};
    lastTrackedPageRef.current = 1;
    lastTrackedZoomRef.current = 100;

    async function loadLocalProgress() {
      const fingerprint = await createDocumentFingerprint(file);

      if (!isActive) {
        return;
      }

      const key = `${PROGRESS_KEY_PREFIX}${fingerprint}`;
      const storedProgress = getStoredProgress(key);

      setProgressKey(key);

      if (storedProgress?.zoom) {
        setZoom(clamp(storedProgress.zoom, MIN_ZOOM, MAX_ZOOM));
      }

      if (storedProgress?.page && storedProgress.page > 1) {
        setCurrentPage(storedProgress.page);
        setRestoredPage(storedProgress.page);
        setPendingScrollPage(storedProgress.page);
        void trackEvent("reader_progress_restored", {
          page: storedProgress.page,
          source: "reader",
          success: true
        });
      }

      setHasLoadedProgress(true);
    }

    void loadLocalProgress();

    return () => {
      isActive = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    if (!progressKey || !numPages || !hasLoadedProgress) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          progressKey,
          JSON.stringify({
            page: clamp(currentPage, 1, numPages),
            zoom
          } satisfies StoredProgress)
        );
      } catch {
        return;
      }
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentPage, hasLoadedProgress, numPages, progressKey, zoom]);

  useEffect(() => {
    if (!numPages || !hasLoadedProgress) {
      return;
    }

    const targetPage = clamp(restoredPage ?? 1, 1, numPages);
    setVisiblePageCount((currentCount) =>
      Math.min(Math.max(currentCount, INITIAL_VISIBLE_PAGES), numPages)
    );
    if (targetPage > INITIAL_VISIBLE_PAGES) {
      setExtraPageNumbers((currentPages) =>
        currentPages.includes(targetPage)
          ? currentPages
          : [...currentPages, targetPage]
      );
    }
    setPendingScrollPage(targetPage);
  }, [hasLoadedProgress, numPages, restoredPage]);

  useEffect(() => {
    if (!pendingScrollPage || !pageRefs.current[pendingScrollPage]) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      pageRefs.current[pendingScrollPage]?.scrollIntoView({
        block: "start",
        behavior: "smooth"
      });
      setPendingScrollPage(null);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [pendingScrollPage, visiblePageCount, extraPageNumbers]);

  const sequentialPagesToRender = Math.min(visiblePageCount, numPages);
  const pagesToDisplay = useMemo(() => {
    const pageNumbers = new Set<number>();

    for (
      let pageNumber = 1;
      pageNumber <= sequentialPagesToRender;
      pageNumber += 1
    ) {
      pageNumbers.add(pageNumber);
    }

    extraPageNumbers.forEach((pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= numPages) {
        pageNumbers.add(pageNumber);
      }
    });

    return Array.from(pageNumbers).sort((left, right) => left - right);
  }, [extraPageNumbers, numPages, sequentialPagesToRender]);

  useEffect(() => {
    if (!numPages || pagesToDisplay.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        const pageNumber = Number(
          visibleEntry?.target.getAttribute("data-page-number")
        );

        if (pageNumber) {
          setCurrentPage((currentPageNumber) =>
            currentPageNumber === pageNumber ? currentPageNumber : pageNumber
          );
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.5, 0.8]
      }
    );

    pagesToDisplay.forEach((pageNumber) => {
      const element = pageRefs.current[pageNumber];
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [numPages, pagesToDisplay]);

  useEffect(() => {
    if (!numPages || lastTrackedPageRef.current === currentPage) {
      return;
    }

    lastTrackedPageRef.current = currentPage;
    void trackEvent("reader_page_changed", {
      pageNumber: currentPage,
      source: "reader"
    });
  }, [currentPage, numPages]);

  useEffect(() => {
    const normalizedQuery = deferredSearchQuery.trim();

    if (!normalizedQuery) {
      setSearchMatches([]);
      setActiveSearchMatchIndex(0);
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const matches: SearchMatch[] = [];

      pagesToDisplay.forEach((pageNumber) => {
        const pageText = pageRefs.current[pageNumber]?.innerText ?? "";
        const count = countOccurrences(pageText, normalizedQuery);

        if (count > 0) {
          matches.push({ pageNumber, count });
        }
      });

      const totalMatches = matches.reduce((total, match) => total + match.count, 0);
      setSearchMatches(matches);
      setActiveSearchMatchIndex(0);
      setIsSearching(false);

      void trackEvent("reader_search_used", {
        matchCount: totalMatches,
        queryLength: normalizedQuery.length,
        searchedLoadedPages: pagesToDisplay.length,
        source: "reader"
      });
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [deferredSearchQuery, pagesToDisplay]);

  useEffect(() => {
    if (lastTrackedZoomRef.current === zoom) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastTrackedZoomRef.current = zoom;
      void trackEvent("reader_zoom_changed", {
        source: "reader",
        zoom
      });
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [zoom]);

  useEffect(() => {
    if (!isLoadingMore) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsLoadingMore(false);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLoadingMore, pagesToDisplay.length]);

  const hasMorePages = sequentialPagesToRender < numPages;
  const isMobileViewer = viewerWidth < 768;
  const basePageWidth = isMobileViewer
    ? Math.max(280, viewerWidth - 8)
    : Math.min(750, Math.max(320, viewerWidth - 32));
  const pageWidth = Math.round(basePageWidth * (zoom / 100));
  const totalSearchMatches = useMemo(
    () => searchMatches.reduce((total, match) => total + match.count, 0),
    [searchMatches]
  );

  const handleLoadSuccess = useCallback(({ numPages: loadedPages }: PDFLoadSuccess) => {
    setNumPages(loadedPages);
    setVisiblePageCount(Math.min(INITIAL_VISIBLE_PAGES, loadedPages));
    setHasError(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setHasError(true);
  }, []);

  const goToPage = useCallback(
    (pageNumber: number) => {
      if (!numPages) {
        return;
      }

      const targetPage = clamp(pageNumber, 1, numPages);
      if (targetPage > visiblePageCount) {
        setExtraPageNumbers((currentPages) =>
          currentPages.includes(targetPage)
            ? currentPages
            : [...currentPages, targetPage]
        );
      }
      setCurrentPage(targetPage);
      setPendingScrollPage(targetPage);
    },
    [numPages, visiblePageCount]
  );

  const updateZoom = useCallback((nextZoom: number) => {
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    setZoom(clampedZoom);
  }, []);

  const handleLoadMorePages = useCallback(() => {
    setIsLoadingMore(true);
    setVisiblePageCount((currentCount) =>
      Math.min(currentCount + PAGES_PER_BATCH, numPages)
    );
    void trackEvent("reader_load_more_pages_clicked", {
      loadedPages: pagesToDisplay.length,
      source: "reader",
      totalPages: numPages
    });
  }, [numPages, pagesToDisplay.length]);

  const goToSearchMatch = useCallback((direction: "next" | "previous") => {
    if (searchMatches.length === 0) {
      return;
    }

    const nextIndex =
      direction === "next"
        ? (activeSearchMatchIndex + 1) % searchMatches.length
        : (activeSearchMatchIndex - 1 + searchMatches.length) %
          searchMatches.length;

    setActiveSearchMatchIndex(nextIndex);
    goToPage(searchMatches[nextIndex].pageNumber);
  }, [activeSearchMatchIndex, goToPage, searchMatches]);

  const setPageRef = useCallback(
    (pageNumber: number, element: HTMLDivElement | null) => {
      pageRefs.current[pageNumber] = element;
    },
    []
  );

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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="sticky top-[68px] z-30 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur md:top-[76px] md:rounded-2xl md:p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="min-h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="min-h-11 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
              Page {currentPage} / {numPages || "-"}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={!numPages || currentPage >= numPages}
              className="min-h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

            <button
              type="button"
              onClick={() => updateZoom(zoom - ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
              className="min-h-11 min-w-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Zoom out"
            >
              -
            </button>
            <label className="flex min-h-11 w-24 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 sm:w-auto sm:gap-3">
              <span>{zoom}%</span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={ZOOM_STEP}
                value={zoom}
                onChange={(event) => updateZoom(Number(event.target.value))}
                className="hidden accent-[#4F6EF7] sm:block sm:w-36"
                aria-label="PDF zoom"
              />
            </label>
            <button
              type="button"
              onClick={() => updateZoom(zoom + ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
              className="min-h-11 min-w-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Zoom in"
            >
              +
            </button>

            {hasMorePages ? (
              <button
                type="button"
                onClick={handleLoadMorePages}
                disabled={isLoadingMore}
                className="min-h-11 shrink-0 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2 md:mt-3 md:flex-row md:items-center">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearching(Boolean(event.target.value.trim()));
            }}
            placeholder="Search loaded pages..."
            className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4F6EF7] focus:ring-4 focus:ring-blue-100"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToSearchMatch("previous")}
              disabled={searchMatches.length === 0}
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Match prev
            </button>
            <button
              type="button"
              onClick={() => goToSearchMatch("next")}
              disabled={searchMatches.length === 0}
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Match next
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          {numPages > 0 ? (
            <span>
              <span className="md:hidden">
                {pagesToDisplay.length} / {numPages} pages loaded
              </span>
              <span className="hidden md:inline">
                Showing {pagesToDisplay.length} loaded of {numPages} pages
                {hasMorePages
                  ? ". More pages load only when you ask for them."
                  : "."}
              </span>
            </span>
          ) : null}
          {searchQuery.trim() ? (
            <span>
              {isSearching ? "Searching loaded pages..." : `${totalSearchMatches} matches in loaded pages`}
              {searchMatches.length > 0
                ? `, page ${searchMatches[activeSearchMatchIndex]?.pageNumber}`
                : ""}
            </span>
          ) : null}
          {restoredPage ? (
            <span className="font-semibold text-[#4F6EF7]">
              Continued from page {restoredPage}
            </span>
          ) : null}
        </div>
      </div>

      <div
        ref={viewerContainerRef}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
        className="flex w-full max-w-full select-none justify-center overflow-x-auto [-webkit-touch-callout:none] [-webkit-user-select:none] md:select-text md:[-webkit-user-select:text]"
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
          <div className="flex max-w-full flex-col items-center gap-6 px-1">
            {pagesToDisplay.map((pageNumber) => {
              return (
                <PDFPageView
                  key={`page-${pageNumber}`}
                  pageNumber={pageNumber}
                  pageWidth={pageWidth}
                  setPageRef={setPageRef}
                />
              );
            })}

            {hasMorePages ? (
              <button
                type="button"
                onClick={handleLoadMorePages}
                disabled={isLoadingMore}
                className="hidden min-h-11 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex md:items-center"
              >
                {isLoadingMore ? "Loading more pages..." : "Load more pages"}
              </button>
            ) : null}
          </div>
        </Document>
      </div>
    </div>
  );
}
