"use client";

import { useReader } from "@/context/ReaderContext";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { DOCXViewer } from "@/components/reader/DOCXViewer";
import { PDFViewer } from "@/components/reader/PDFViewer";
import { TranslationPopup } from "@/components/reader/TranslationPopup";
import { API_ROUTES } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE_MB = 150;
const LARGE_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const LARGE_FILE_SIZE = LARGE_FILE_SIZE_MB * 1024 * 1024;
const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ReaderFileType = "pdf" | "docx" | null;

type PopupPosition = {
  x: number;
  y: number;
};

type WordTapPayload = {
  word: string;
  x: number;
  y: number;
};

function truncateFilename(filename: string) {
  if (filename.length <= 30) {
    return filename;
  }

  return `${filename.slice(0, 30)}...`;
}

function getSentenceContext(selectedText: string): string {
  const bodyText = document.body.innerText;
  const index = bodyText.indexOf(selectedText);

  if (index === -1) {
    return selectedText;
  }

  const start = Math.max(0, index - 150);
  const end = Math.min(bodyText.length, index + selectedText.length + 150);

  return bodyText.slice(start, end);
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 3 5 6v5c0 4.4 2.8 8.3 7 9.7 4.2-1.4 7-5.3 7-9.7V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M7 18a5 5 0 0 1 .8-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 7.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19V11m0 0-3 3m3-3 3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 7v14M4 5.5A3.5 3.5 0 0 1 7.5 2H12v19H7.5A3.5 3.5 0 0 0 4 17.5v-12ZM20 5.5A3.5 3.5 0 0 0 16.5 2H12v19h4.5a3.5 3.5 0 0 1 3.5-3.5v-12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ReaderPage() {
  const { pdfFile, pdfName, setDetectedSourceLang, setPdfFile } = useReader();
  const documentContentRef = useRef<HTMLDivElement | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [contextSentence, setContextSentence] = useState("");
  const [popupPosition, setPopupPosition] = useState<PopupPosition>({
    x: 0,
    y: 0
  });
  const [showPopup, setShowPopup] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [streak, setStreak] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState("");
  const [saveError, setSaveError] = useState("");

  const fileType = useMemo<ReaderFileType>(() => {
    if (!pdfFile) {
      return null;
    }

    const fileName = pdfFile.name.toLowerCase();

    if (pdfFile.type === "application/pdf" || fileName.endsWith(".pdf")) {
      return "pdf";
    }

    if (pdfFile.type === DOCX_MIME_TYPE || fileName.endsWith(".docx")) {
      return "docx";
    }

    return null;
  }, [pdfFile]);

  const isLargeDocument = Boolean(pdfFile && pdfFile.size > LARGE_FILE_SIZE);

  async function getAccessToken() {
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    return session?.access_token;
  }

  useEffect(() => {
    async function fetchStreak() {
      try {
        const token = await getAccessToken();

        if (!token) {
          return;
        }

        const response = await fetch(API_ROUTES.userMe, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { streak_count?: number } | null;
        setStreak(data?.streak_count || 0);
      } catch {
        setStreak(0);
      }
    }

    fetchStreak();
  }, []);

  useEffect(() => {
    if (!pdfFile || !fileType) {
      return;
    }

    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function detectRenderedLanguage(attempt = 0) {
      const text = documentContentRef.current?.innerText.trim() ?? "";
      const textSample = text.slice(0, 500);

      if (textSample.length < 20 && attempt < 6) {
        timeoutId = setTimeout(() => {
          detectRenderedLanguage(attempt + 1);
        }, 600);
        return;
      }

      if (textSample.length < 20) {
        return;
      }

      try {
        const token = await getAccessToken();

        if (!token) {
          return;
        }

        const response = await fetch(API_ROUTES.detectLanguage, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: textSample })
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { detected_lang?: string } | null;

        if (isActive && data?.detected_lang) {
          setDetectedSourceLang(data.detected_lang);
        }
      } catch {
        return;
      }
    }

    timeoutId = setTimeout(() => {
      detectRenderedLanguage();
    }, 800);

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fileType, pdfFile, setDetectedSourceLang]);

  function handleFile(nextFile: File) {
    setFileError(null);
    setSizeError("");

    if (nextFile.size > MAX_FILE_SIZE) {
      setFileError(
        `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`
      );
      return;
    }

    const fileName = nextFile.name.toLowerCase();
    const isPDF =
      nextFile.type === "application/pdf" || fileName.endsWith(".pdf");
    const isDOCX =
      nextFile.type === DOCX_MIME_TYPE || fileName.endsWith(".docx");

    if (!isPDF && !isDOCX) {
      setSizeError("Only PDF and DOCX files allowed");
      return;
    }

    setPdfFile(nextFile);
    setFileError(null);
    setSizeError("");
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }

  useEffect(() => {
    if (!pdfFile) {
      return;
    }

    function handleMouseUp() {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";

      if (text.length < 2 || text.length > 100) {
        return;
      }

      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const context = getSentenceContext(text);

      setSelectedText(text);
      setContextSentence(context);
      setPopupPosition({
        x: rect.left,
        y: rect.bottom + window.scrollY + 8
      });
      setShowPopup(true);
    }

    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pdfFile]);

  function handleWordTap({ word, x, y }: WordTapPayload) {
    const text = word.trim();

    if (text.length < 2 || text.length > 100) {
      return;
    }

    setSelectedText(text);
    setContextSentence(getSentenceContext(text));
    setPopupPosition({
      x,
      y: y + window.scrollY + 8
    });
    setShowPopup(true);
  }

  async function handleSave(word: string, translation: string) {
    setSaveError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Missing auth token");
      }

      const saveResponse = await fetch(API_ROUTES.vocabulary, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          original: word,
          translation,
          context_sentence: contextSentence,
          document_name: pdfName ?? ""
        })
      });

      if (!saveResponse.ok) {
        throw new Error("Save request failed");
      }

      setSavedCount((previous) => previous + 1);

      const activityResponse = await fetch(API_ROUTES.userActivity, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (activityResponse.ok) {
        const activityData = (await activityResponse.json()) as {
          streak?: number;
          is_new_day?: boolean;
        } | null;

        if (activityData?.is_new_day && typeof activityData.streak === "number") {
          setStreak(activityData.streak);
        }
      }

      setShowPopup(false);
    } catch {
      setSaveError("Could not save this word. Please try again.");
      throw new Error("Could not save word");
    }
  }

  function handleCloseFile() {
    setPdfFile(null);
    setDetectedSourceLang(null);
    setSavedCount(0);
    setSelectedText("");
    setContextSentence("");
    setShowPopup(false);
  }

  if (!pdfFile) {
    return (
      <main className="min-h-[calc(100vh-8rem)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 md:py-8">
        <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            Let&apos;s get started ✨
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Upload a document to begin reading
          </p>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-8 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white/80 px-4 py-8 shadow-sm transition sm:px-10 sm:py-12 ${
              dragOver ? "border-[#4F6EF7] bg-blue-50/60" : "border-slate-300"
            }`}
          >
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-blue-100 blur-xl" />
              <svg
                className="relative h-20 w-20 drop-shadow-lg"
                viewBox="0 0 96 96"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M25 12h31l18 18v49a8 8 0 0 1-8 8H25a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8Z"
                  fill="#DBEAFE"
                  stroke="#4F6EF7"
                  strokeWidth="3"
                />
                <path d="M56 13v19h18" fill="#BFDBFE" />
                <path
                  d="M56 13v19h18"
                  stroke="#4F6EF7"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M34 43h22M34 55h28M34 67h18"
                  stroke="#93C5FD"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="62" cy="67" r="16" fill="#4F6EF7" />
                <path
                  d="M62 75V59M55 66l7-7 7 7"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-lg font-bold tracking-normal text-slate-950">
              Drop your PDF or DOCX here
            </h2>
            <p className="mt-3 text-sm text-slate-500">or</p>

            <label className="mt-5 flex min-h-12 w-full max-w-xs cursor-pointer items-center justify-center rounded-lg bg-[#4F6EF7] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-indigo-600">
              📁 Choose file
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileInput}
                className="sr-only"
              />
            </label>

            <p className="mt-4 text-sm font-semibold text-emerald-600">
              ✅ Supports PDF and DOCX files
            </p>
          </div>

          {fileError ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
              <span>⚠️</span>
              <span>{fileError}</span>
            </div>
          ) : null}

          <div className="mt-6 flex w-full flex-col items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-left shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#4F6EF7] ring-1 ring-blue-100">
                <ShieldIcon />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-950">
                  Your files never leave your device
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Your document stays on your device. LexiFlow only sends
                  selected words and short context for translation/explanation.
                </p>
              </div>
            </div>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-[#4F6EF7] transition hover:text-indigo-600"
            >
              Learn more →
            </a>
          </div>

          {sizeError ? (
            <p className="mt-4 text-sm font-medium text-red-600">
              {sizeError}
            </p>
          ) : null}

          <section id="how-it-works" className="mt-10 w-full text-left">
            <h2 className="text-base font-bold text-slate-950">How it works</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start">
              <div className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-100">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-[#4F6EF7]">
                  <UploadIcon />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-950">
                  1 Upload
                </p>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Add your PDF or DOCX file
                </p>
              </div>

              <div className="hidden pt-10 text-xl font-semibold text-slate-300 md:block">
                &gt;
              </div>

              <div className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-100">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-[#4F6EF7]">
                  <BookOpenIcon />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-950">2 Read</p>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Read comfortably with focus
                </p>
              </div>

              <div className="hidden pt-10 text-xl font-semibold text-slate-300 md:block">
                &gt;
              </div>

              <div className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-100">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-[#4F6EF7]">
                  <BookmarkIcon />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-950">
                  3 Save Words
                </p>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Save new words and build your vocabulary
                </p>
              </div>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <p className="min-w-0 max-w-full truncate text-sm font-bold text-slate-950 sm:max-w-md">
            {truncateFilename(
              (pdfName ?? "Untitled document").length > 15
                ? `${(pdfName ?? "Untitled document").slice(0, 15)}...`
                : pdfName ?? "Untitled document"
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 sm:px-3">
              💾 {savedCount} saved
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-sm font-medium text-amber-700 sm:px-3">
              🔥 {streak} day streak
            </span>
            <button
              type="button"
              onClick={handleCloseFile}
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>

      <div ref={documentContentRef} className="max-w-full overflow-x-hidden px-2 py-6 sm:px-6 sm:py-8">
        {isLargeDocument ? (
          <div className="mx-auto mb-4 max-w-4xl rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Large document detected. LexiFlow will open it locally in your
            browser. This may take a moment, but your file will not be uploaded.
          </div>
        ) : null}
        {fileType === "pdf" ? (
          <PDFViewer file={pdfFile} onWordTap={handleWordTap} />
        ) : null}
        {fileType === "docx" ? (
          <DOCXViewer file={pdfFile} onWordTap={handleWordTap} />
        ) : null}
        {saveError ? (
          <p className="mx-auto mt-4 max-w-4xl rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </p>
        ) : null}
      </div>

      {showPopup ? (
        <TranslationPopup
          selectedText={selectedText}
          contextSentence={contextSentence}
          position={popupPosition}
          onClose={() => setShowPopup(false)}
          onSave={handleSave}
        />
      ) : null}
    </main>
  );
}
