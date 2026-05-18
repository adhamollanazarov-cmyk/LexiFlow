"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReader } from "@/context/ReaderContext";
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
  onSave: (word: string, translation: string) => Promise<void> | void;
};

type ActiveTab = "translation" | "explain";

type TranslateResponse = {
  translation: string;
};

type ExplainResponse = {
  explanation: string;
};

type UserPreferencesResponse = {
  source_lang?: string;
  target_lang?: string;
};

type LanguagePreferences = {
  sourceLang: string;
  targetLang: string;
};

type ParsedExplanation = {
  explanationText: string;
  examples: string[];
};

const POPUP_WIDTH = 320;
const POPUP_HEIGHT = 280;
const VIEWPORT_MARGIN = 16;
const EXAMPLES_MARKER = "✏️ Examples:";
const LANGUAGE_NAME_BY_CODE: Record<string, string> = {
  "EN-US": "English",
  "EN-GB": "English",
  RU: "Russian",
  DE: "German",
  FR: "French",
  ES: "Spanish",
  UZ: "Uzbek",
  TR: "Turkish"
};

function parseExplanationResponse(response: string): ParsedExplanation {
  const [rawExplanation, rawExamples = ""] = response.split(EXAMPLES_MARKER);
  const explanationText = rawExplanation
    .replace("📖 Explanation:", "")
    .trim();
  const examples = rawExamples
    .split(/\r?\n/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 2);

  return { explanationText, examples };
}

function FormattedExplanation({ text }: { text: string }) {
  const { explanationText, examples } = parseExplanationResponse(text);

  if (!examples.length) {
    return <p className="text-sm leading-6 text-slate-700">{text}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-slate-700">{explanationText}</p>
      <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-normal text-slate-500">
          Examples
        </p>
        <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm leading-6 text-slate-700">
          {examples.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function TranslationPopup({
  selectedText,
  contextSentence,
  position,
  onClose,
  onSave
}: TranslationPopupProps) {
  const { detectedSourceLang } = useReader();
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("translation");
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplain, setIsLoadingExplain] = useState(false);
  const [explainError, setExplainError] = useState("");
  const [languagePreferences, setLanguagePreferences] =
    useState<LanguagePreferences>({
      sourceLang: "DE",
      targetLang: "RU"
    });

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

  async function getLanguagePreferences(
    token: string
  ): Promise<LanguagePreferences> {
    const response = await fetch(API_ROUTES.userMe, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return { sourceLang: "DE", targetLang: "RU" };
    }

    const data = (await response.json()) as UserPreferencesResponse | null;

    return {
      sourceLang: data?.source_lang || "DE",
      targetLang: data?.target_lang || "RU"
    };
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

        const preferences = await getLanguagePreferences(token);

        const response = await fetch(API_ROUTES.translate, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: selectedText,
            source_lang: detectedSourceLang ?? preferences.sourceLang,
            target_lang: preferences.targetLang
          })
        });

        if (!response.ok) {
          throw new Error("Translation request failed");
        }

        const data = (await response.json()) as TranslateResponse | null;

        if (!data?.translation) {
          throw new Error("Translation response was empty");
        }

        if (isActive) {
          setLanguagePreferences(preferences);
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

    if (window.innerWidth < 768) {
      popupRef.current.style.left = "";
      popupRef.current.style.top = "";
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
          target_lang: languagePreferences.targetLang,
          ui_language:
            LANGUAGE_NAME_BY_CODE[languagePreferences.targetLang] ?? "English",
          source_language:
            LANGUAGE_NAME_BY_CODE[
              detectedSourceLang ?? languagePreferences.sourceLang
            ] ?? "German"
        })
      });

      if (!response.ok) {
        throw new Error("Explanation request failed");
      }

      const data = (await response.json()) as ExplainResponse | null;

      if (!data?.explanation) {
        throw new Error("Explanation response was empty");
      }

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

  async function handleSave() {
    if (!translation) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave(selectedText, translation);
      setIsSaved(true);
    } catch {
      setErrorMessage("Could not save word");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      ref={popupRef}
      className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 md:inset-x-auto md:bottom-auto md:w-[min(320px,calc(100vw-32px))] md:rounded-md md:shadow-xl"
    >
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-slate-400 transition hover:text-slate-700 md:right-3 md:top-3 md:min-h-0 md:min-w-0"
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
          className={`min-h-11 rounded-md px-3 py-2 text-sm font-semibold transition ${
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
          className={`min-h-11 rounded-md px-3 py-2 text-sm font-semibold transition ${
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
              <FormattedExplanation text={explanation} />
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
        disabled={!translation || isSaved || isSaving}
        className="mt-4 min-h-12 w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
