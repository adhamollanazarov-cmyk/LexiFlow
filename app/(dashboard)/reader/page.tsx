"use client";

import { useReader } from "@/lib/reader-context";
import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import { DOCXViewer } from "@/components/reader/DOCXViewer";
import { PDFViewer } from "@/components/reader/PDFViewer";
import { TranslationPopup } from "@/components/reader/TranslationPopup";
import { API_ROUTES } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ReaderFileType = "pdf" | "docx" | null;

type PopupPosition = {
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

export default function ReaderPage() {
  const { file, setFile } = useReader();
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
  const [sizeError, setSizeError] = useState("");
  const [fileType, setFileType] = useState<ReaderFileType>(null);
  const [saveError, setSaveError] = useState("");

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

  function handleFile(nextFile: File) {
    const fileName = nextFile.name.toLowerCase();
    const isPDF =
      nextFile.type === "application/pdf" || fileName.endsWith(".pdf");
    const isDOCX =
      nextFile.type === DOCX_MIME_TYPE || fileName.endsWith(".docx");

    if (!isPDF && !isDOCX) {
      setSizeError("Only PDF and DOCX files allowed");
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      setSizeError("File too large (max 50MB)");
      return;
    }

    setFile(nextFile);
    setFileType(isPDF ? "pdf" : "docx");
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
    if (!file) {
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
  }, [file]);

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
          document_name: file?.name ?? ""
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
    setFile(null);
    setFileType(null);
    setSavedCount(0);
    setSelectedText("");
    setContextSentence("");
    setShowPopup(false);
  }

  if (!file) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex w-full max-w-2xl flex-col items-center justify-center rounded-md border-2 border-dashed bg-white px-8 py-16 text-center shadow-sm transition ${
            dragOver ? "border-slate-950" : "border-slate-300"
          }`}
        >
          <div className="text-5xl">📄</div>
          <h1 className="mt-6 text-2xl font-semibold tracking-normal text-slate-950">
            Drop your PDF or DOCX here
          </h1>
          <p className="mt-3 text-sm text-slate-500">or</p>

          <label className="mt-5 cursor-pointer rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
            Choose PDF or DOCX
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileInput}
              className="sr-only"
            />
          </label>
        </div>

        <div className="mt-6 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          🔒 Your file never leaves your device
        </div>

        {sizeError ? (
          <p className="mt-4 text-sm font-medium text-red-600">{sizeError}</p>
        ) : null}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <p className="truncate text-sm font-semibold text-slate-950">
            {truncateFilename(file.name)}
          </p>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
              💾 {savedCount} saved
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
              🔥 {streak} day streak
            </span>
            <button
              type="button"
              onClick={handleCloseFile}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {fileType === "pdf" ? <PDFViewer file={file} /> : null}
        {fileType === "docx" ? <DOCXViewer file={file} /> : null}
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
