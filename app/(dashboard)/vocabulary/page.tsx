"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_ROUTES } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { WordCard, type VocabularyWord } from "@/components/vocabulary/WordCard";

type VocabularyResponse = {
  words: VocabularyWord[];
  total: number;
};

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);

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
        return;
      }

      const data = (await response.json()) as VocabularyResponse | null;
      setWords(Array.isArray(data?.words) ? data.words : []);
      setTotalCount(typeof data?.total === "number" ? data.total : 0);
    } catch {
      setWords([]);
      setTotalCount(0);
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

  if (isLoading) {
    return (
      <section className="flex min-h-[calc(100vh-9rem)] items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Loading your vocabulary...
        </p>
      </section>
    );
  }

  if (words.length === 0) {
    return (
      <section className="flex min-h-[calc(100vh-9rem)] items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-normal text-slate-950">
            No words saved yet
          </h1>
          <Link
            href="/reader"
            className="mt-4 inline-flex rounded-lg bg-[#4F6EF7] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-indigo-600"
          >
            Go to Reader to start saving words
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl bg-slate-50">
      <div className="mb-6 flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-normal text-slate-950">
            My Vocabulary
          </h1>
          <span className="shrink-0 pb-1 text-sm font-medium text-slate-500">
            {totalCount} words saved
          </span>
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
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4F6EF7] focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            ⚯ Filter
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
            ✨
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">
              Keep learning new words every day.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your vocabulary is growing! 👊
            </p>
          </div>
        </div>
        <Link
          href="/reader"
          className="inline-flex justify-center rounded-lg bg-[#4F6EF7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-indigo-600"
        >
          Review words
        </Link>
      </div>
    </section>
  );
}
