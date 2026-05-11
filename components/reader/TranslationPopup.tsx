"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_ROUTES } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type PopupPosition = {
  x: number;
  y: number;
};

type TranslationPopupProps = {
  selectedText: string;
  contextSentence: string;
  position: PopupPosition;
  onClose: () => void;
  onSave: (word: string, translation: string) => void;
};

type ActiveTab = "translation" | "explain";

type TranslateResponse = {
  translation: string;
};

type ExplainResponse = {
  explanation: string;
};

const POPUP_WIDTH = 320;
const POPUP_HEIGHT = 280;
const VIEWPORT_MARGIN = 16;

export function TranslationPopup({
  selectedText,
  contextSentence,
  position,
  onClose,
  onSave
}: TranslationPopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("translation");
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplain, setIsLoadingExplain] = useState(false);
  const [explainError, setExplainError] = useState("");

  const popupPosition = useMemo(() => {
    if (typeof window === "undefined") {
      return position;
    }

    const maxX = window.innerWidth - POPUP_WIDTH - VIEWPORT_MARGIN;
    const maxY = window.innerHeight - POPUP_HEIGHT - VIEWPORT_MARGIN;
    const x = Math.min(Math.max(VIEWPORT_MARGIN, position.x), maxX);
    const y = Math.min(
      Math.max(VIEWPORT_MARGIN, position.y - window.scrollY),
      maxY
    );

    return { x, y };
  }, [position]);

  async function getAccessToken() {
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    return session?.access_token;
  }

  useEffect(() => {
    let isActive = true;

    async function fetchTranslation() {
      setActiveTab("translation");
      setIsLoading(true);
      setTranslation(null);
      setIsSaved(false);
      setErrorMessage("");
      setExplanation(null);
      setIsLoadingExplain(false);
      setExplainError("");

      try {
        const token = await getAccessToken();

        if (!token) {
          throw new Error("Missing session token");
        }

        const response = await fetch(API_ROUTES.translate, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: selectedText,
            source_lang: "DE",
            target_lang: "RU"
          })
        });

        if (!response.ok) {
          throw new Error("Translation request failed");
        }

        const data = (await response.json()) as TranslateResponse;

        if (isActive) {
          setTranslation(data.translation);
        }
      } catch {
        if (isActive) {
          setErrorMessage("Translation unavailable");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    fetchTranslation();

    return () => {
      isActive = false;
    };
  }, [selectedText]);

  useEffect(() => {
    if (!popupRef.current) {
      return;
    }

    popupRef.current.style.left = `${popupPosition.x}px`;
    popupRef.current.style.top = `${popupPosition.y}px`;
  }, [popupPosition]);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function fetchExplanation() {
    if (explanation || isLoadingExplain) {
      return;
    }

    setIsLoadingExplain(true);
    setExplainError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Missing session token");
      }

      const response = await fetch(API_ROUTES.explain, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          word: selectedText,
          sentence: contextSentence,
          target_lang: "RU"
        })
      });

      if (!response.ok) {
        throw new Error("Explanation request failed");
      }

      const data = (await response.json()) as ExplainResponse;
      setExplanation(data.explanation);
    } catch {
      setExplainError("AI explanation unavailable");
    } finally {
      setIsLoadingExplain(false);
    }
  }

  function handleTabChange(nextTab: ActiveTab) {
    setActiveTab(nextTab);

    if (nextTab === "explain") {
      fetchExplanation();
    }
  }

  function handleSave() {
    if (!translation) {
      return;
    }

    onSave(selectedText, translation);
    setIsSaved(true);
  }

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-[320px] rounded-md bg-white p-4 shadow-xl ring-1 ring-slate-200"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 text-sm font-semibold text-slate-400 transition hover:text-slate-700"
        aria-label="Close translation popup"
      >
        x
      </button>

      <p className="pr-8 text-sm font-semibold text-slate-950">
        {selectedText}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("translation")}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
            activeTab === "translation"
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Translation
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("explain")}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
            activeTab === "explain"
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          AI Explain
        </button>
      </div>

      <div className="mt-4 min-h-24">
        {activeTab === "translation" ? (
          <>
            {isLoading ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                Translating...
              </div>
            ) : null}

            {!isLoading && translation ? (
              <p className="text-base font-medium text-slate-800">
                {translation}
              </p>
            ) : null}

            {!isLoading && errorMessage ? (
              <p className="text-sm text-red-600">{errorMessage}</p>
            ) : null}
          </>
        ) : (
          <>
            {isLoadingExplain ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                Explaining...
              </div>
            ) : null}

            {!isLoadingExplain && explanation ? (
              <p className="text-sm leading-6 text-slate-700">{explanation}</p>
            ) : null}

            {!isLoadingExplain && explainError ? (
              <p className="text-sm text-red-600">{explainError}</p>
            ) : null}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!translation || isSaved}
        className="mt-4 w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
