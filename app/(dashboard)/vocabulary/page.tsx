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

    const token = await getAccessToken();
    if (!token) {
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as VocabularyResponse;
    setWords(data.words);
    setTotalCount(data.total);
    setIsLoading(false);
  }

  async function deleteWord(wordId: string) {
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
      <section className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
        <p className="text-sm font-medium text-slate-500">
          Loading your vocabulary...
        </p>
      </section>
    );
  }

  if (words.length === 0) {
    return (
      <section className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            No words saved yet
          </h1>
          <Link
            href="/reader"
            className="mt-4 inline-flex rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Go to Reader to start saving words
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              My Vocabulary
            </h1>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
              {totalCount} words saved
            </span>
          </div>
        </div>

        <label className="w-full md:max-w-sm">
          <span className="sr-only">Search words</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search words..."
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      {filteredWords.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
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
    </section>
  );
}
