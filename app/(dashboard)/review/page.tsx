"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FlashCard, type FlashCardWord } from "@/components/FlashCard";
import { trackEvent } from "@/lib/analytics";
import { API_ROUTES } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type ReviewDueResponse = {
  words: FlashCardWord[];
  total: number;
};

type ReviewSubmitResponse = {
  word_id: string;
  next_review_at: string;
  interval_days: number;
  easiness_factor: number;
  streak_maintained: boolean;
  current_streak: number;
};

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token;
}

export default function DailyReviewPage() {
  const [words, setWords] = useState<FlashCardWord[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentWord = words[0] ?? null;
  const isComplete = !currentWord && totalDue > 0;
  const progressText = useMemo(() => {
    return `${reviewedCount} of ${totalDue} reviewed today`;
  }, [reviewedCount, totalDue]);

  async function fetchDueWords() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const token = await getAccessToken();

      if (!token) {
        setWords([]);
        setTotalDue(0);
        return;
      }

      const response = await fetch(`${API_ROUTES.reviewDue}?limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Could not load review words");
      }

      const data = (await response.json()) as ReviewDueResponse | null;
      const nextWords = Array.isArray(data?.words) ? data.words : [];
      setWords(nextWords);
      setTotalDue(typeof data?.total === "number" ? data.total : nextWords.length);

      if (nextWords.length > 0) {
        void trackEvent("daily_review_started", {
          count: nextWords.length,
          source: "review",
        });
      }
    } catch {
      setErrorMessage("Could not load your daily review.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void trackEvent("daily_review_opened", { source: "review" });
    void fetchDueWords();
  }, []);

  async function handleReview(quality: number) {
    if (!currentWord || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Missing auth token");
      }

      const response = await fetch(API_ROUTES.reviewSubmit, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word_id: currentWord.id,
          quality,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not update review");
      }

      const result = (await response.json()) as ReviewSubmitResponse;

      void trackEvent("flashcard_reviewed", {
        action: quality >= 3 ? "success" : "again",
        reviewLevel: currentWord.repetitions,
        source: "review",
      });

      if (quality >= 3) {
        setCorrectCount((count) => count + 1);
      }

      setCurrentStreak(result.current_streak);
      setWords((currentWords) => {
        const nextWords = currentWords.slice(1);

        if (nextWords.length === 0) {
          void trackEvent("daily_review_completed", {
            reviewedCount: reviewedCount + 1,
            source: "review",
            success: true,
          });
        }

        return nextWords;
      });
      setReviewedCount((currentCount) => currentCount + 1);
    } catch {
      setErrorMessage("Could not update this review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
        <p className="text-sm font-medium text-slate-500">
          Loading your daily review...
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-normal text-slate-950">
          Daily Review
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Review your saved words and keep them fresh.
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
          {!currentWord ? (
            <button
              type="button"
              onClick={() => void fetchDueWords()}
              className="mt-3 min-h-11 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {!currentWord && !isComplete ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            No words to review today.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Nothing to review today. Come back tomorrow or save more words from
            the Reader.
          </p>
          <Link
            href="/reader"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#4F6EF7] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-indigo-600"
          >
            Open Reader
          </Link>
        </div>
      ) : null}

      {isComplete ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Review complete
          </h2>
          <div className="mx-auto mt-6 grid max-w-lg gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-950">
                {reviewedCount}
              </p>
              <p className="mt-1 text-sm text-slate-500">Cards reviewed</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-950">
                {correctCount}
              </p>
              <p className="mt-1 text-sm text-slate-500">Correct</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-950">
                {currentStreak}
              </p>
              <p className="mt-1 text-sm text-slate-500">Day streak</p>
            </div>
          </div>
          <Link
            href="/vocabulary"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to Vocabulary
          </Link>
        </div>
      ) : null}

      {currentWord ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-500">
              {progressText}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-500">
              {words.length} due
            </span>
          </div>

          <FlashCard
            key={currentWord.id}
            word={currentWord}
            onRate={handleReview}
            isSubmitting={isSubmitting}
          />
        </>
      ) : null}
    </section>
  );
}
