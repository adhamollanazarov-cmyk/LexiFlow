"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { API_ROUTES } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import {
  WordCard,
  getWordStatus,
  type VocabularyWord
} from "@/components/vocabulary/WordCard";

type VocabularyResponse = {
  words: VocabularyWord[];
  total: number;
};

type ReviewDueResponse = {
  words?: VocabularyWord[];
  total?: number;
};

function isDueForReview(word: VocabularyWord) {
  if (!word.next_review_at) {
    return true;
  }

  const reviewDate = new Date(word.next_review_at);
  return !Number.isNaN(reviewDate.getTime()) && reviewDate <= new Date();
}

function escapeCsvCell(value: string | number | null | undefined) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function exportVocabularyCsv(words: VocabularyWord[]) {
  if (typeof window === "undefined") {
    return;
  }

  const headers = [
    "word",
    "translation",
    "example_context",
    "explanation",
    "status",
    "review_count",
    "next_review_at"
  ];
  const rows = words.map((word) => [
    word.original,
    word.translation,
    word.context_sentence,
    "",
    getWordStatus(word.review_level ?? 0),
    word.review_count ?? 0,
    word.next_review_at ?? ""
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "lexiflow-vocabulary.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [todayReviewCount, setTodayReviewCount] = useState(0);

  async function getAccessToken() {
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    return session?.access_token;
  }

  async function fetchWords() {
    setIsLoading(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        setWords([]);
        setTotalCount(0);
        setTodayReviewCount(0);
        return;
      }

      const response = await fetch(`${API_ROUTES.vocabulary}?limit=100&offset=0`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setWords([]);
        setTotalCount(0);
        setTodayReviewCount(0);
        return;
      }

      const data = (await response.json()) as VocabularyResponse | null;
      const nextWords = Array.isArray(data?.words) ? data.words : [];
      setWords(nextWords);
      setTotalCount(typeof data?.total === "number" ? data.total : 0);

      const reviewResponse = await fetch(`${API_ROUTES.reviewDue}?limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (reviewResponse.ok) {
        const reviewData = (await reviewResponse.json()) as ReviewDueResponse | null;
        setTodayReviewCount(
          typeof reviewData?.total === "number"
            ? reviewData.total
            : nextWords.filter(isDueForReview).length
        );
      } else {
        setTodayReviewCount(nextWords.filter(isDueForReview).length);
      }
    } catch {
      setWords([]);
      setTotalCount(0);
      setTodayReviewCount(0);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteWord(wordId: string) {
    try {
      const token = await getAccessToken();
      if (!token) {
        return;
      }

      const response = await fetch(`${API_ROUTES.vocabulary}/${wordId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWords((currentWords) =>
          currentWords.filter((word) => word.id !== wordId)
        );
        setTotalCount((currentTotal) => Math.max(0, currentTotal - 1));
      }
    } catch {
      return;
    }
  }

  useEffect(() => {
    void trackEvent("vocabulary_opened", { source: "vocabulary" });
    fetchWords();
  }, []);

  const filteredWords = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    return words.filter(
      (word) =>
        word.original.toLowerCase().includes(normalizedSearch) ||
        word.translation.toLowerCase().includes(normalizedSearch)
    );
  }, [searchQuery, words]);

  useEffect(() => {
    const normalizedSearch = searchQuery.trim();

    if (!normalizedSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void trackEvent("vocabulary_search_used", {
        count: filteredWords.length,
        queryLength: normalizedSearch.length,
        source: "vocabulary"
      });
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filteredWords.length, searchQuery]);

  const learningCount = useMemo(
    () =>
      words.filter((word) => {
        const level = word.review_level ?? 0;
        return level >= 1 && level <= 2;
      }).length,
    [words]
  );
  const knownCount = useMemo(
    () => words.filter((word) => (word.review_level ?? 0) >= 3).length,
    [words]
  );

  function handleExportCsv() {
    exportVocabularyCsv(words);
    void trackEvent("vocabulary_export_clicked", {
      count: words.length,
      source: "vocabulary"
    });
  }

  if (isLoading) {
    return (
      <section className="flex min-h-[calc(100vh-9rem)] items-center justify-center overflow-x-hidden bg-slate-50 px-4">
        <p className="text-sm font-medium text-slate-500">
          Loading your vocabulary...
        </p>
      </section>
    );
  }

  if (words.length === 0) {
    return (
      <section className="flex min-h-[calc(100vh-9rem)] items-center justify-center overflow-x-hidden bg-slate-50 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-normal text-slate-950">
            No words saved yet
          </h1>
          <Link
            href="/reader"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#4F6EF7] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-indigo-600"
          >
            Go to Reader to start saving words
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl overflow-x-hidden bg-slate-50">
      <div className="mb-6 flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-normal text-slate-950">
            My Vocabulary
          </h1>
          <span className="shrink-0 pb-1 text-sm font-medium text-slate-500">
            {totalCount} words saved
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total saved</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {totalCount}
            </p>
          </div>
          <Link
            href="/review"
            className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-100"
          >
            <p className="text-sm font-semibold text-indigo-700">
              Today&apos;s review
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {todayReviewCount}
            </p>
          </Link>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Learning words
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {learningCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Known words</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {knownCount}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-bold text-slate-950">
              Today&apos;s review: {todayReviewCount} words
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Review due words as flashcards and keep them fresh.
            </p>
          </div>
          <Link
            href="/review"
            onClick={() =>
              void trackEvent("daily_review_started", {
                count: todayReviewCount,
                source: "vocabulary"
              })
            }
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start review
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="sr-only">Search words</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search saved words..."
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4F6EF7] focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="button"
            className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {filteredWords.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            No words match your search
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredWords.map((word) => (
            <WordCard key={word.id} word={word} onDelete={deleteWord} />
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#4F6EF7] ring-1 ring-indigo-100">
            *
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">
              Keep learning new words every day.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your vocabulary is growing.
            </p>
          </div>
        </div>
        <Link
          href="/review"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#4F6EF7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-indigo-600"
        >
          Review words
        </Link>
      </div>
    </section>
  );
}
