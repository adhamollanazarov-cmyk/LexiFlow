"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { API_ROUTES } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type ReviewWord = {
  id: string;
  original: string;
  translation: string;
  context_sentence: string;
  document_name: string;
  source_lang: string;
  target_lang: string;
  created_at: string;
  review_count: number;
  review_level: number;
};

type ReviewResponse = {
  words: ReviewWord[];
  total: number;
};

type ReviewRating = "again" | "good" | "easy";

const reviewActions: Array<{
  label: string;
  rating: ReviewRating;
  helper: string;
  className: string;
}> = [
  {
    label: "Again",
    rating: "again",
    helper: "Tomorrow",
    className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
  {
    label: "Good",
    rating: "good",
    helper: "3 days",
    className: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    label: "Easy",
    rating: "easy",
    helper: "7 days",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
];

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token;
}

export default function DailyReviewPage() {
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentWord = words[0] ?? null;
  const progressText = useMemo(() => {
    return `${reviewedCount} of ${totalDue} reviewed today`;
  }, [reviewedCount, totalDue]);

  useEffect(() => {
    void trackEvent("daily_review_opened", { source: "review" });

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

        const data = (await response.json()) as ReviewResponse | null;
        const nextWords = Array.isArray(data?.words) ? data.words : [];
        setWords(nextWords);
        setTotalDue(nextWords.length);
      } catch {
        setErrorMessage("Could not load your daily review.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDueWords();
  }, []);

  async function handleReview(rating: ReviewRating) {
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

      const response = await fetch(API_ROUTES.reviewWord(currentWord.id), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error("Could not update review");
      }

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
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      {!currentWord ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            No words to review today.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Save words from the Reader to start your review.
          </p>
          <Link
            href="/reader"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#4F6EF7] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-indigo-600"
          >
            Open Reader
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-500">
              {progressText}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-500">
              {words.length} due
            </span>
          </div>

          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-4xl font-bold tracking-normal text-slate-950">
                  {currentWord.original}
                </h2>
                {currentWord.translation ? (
                  <p className="mt-3 text-xl font-semibold text-[#4F6EF7]">
                    {currentWord.translation}
                  </p>
                ) : null}
              </div>
              {currentWord.source_lang ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-500">
                  {currentWord.source_lang}
                </span>
              ) : null}
            </div>

            {currentWord.context_sentence ? (
              <p className="mt-8 rounded-xl bg-slate-50 p-4 text-sm italic leading-6 text-slate-600">
                &quot;{currentWord.context_sentence}&quot;
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              {currentWord.document_name ? (
                <span className="min-w-0 truncate">
                  {currentWord.document_name}
                </span>
              ) : null}
              <span>Reviewed {currentWord.review_count} times</span>
            </div>
          </article>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {reviewActions.map((action) => (
              <button
                key={action.rating}
                type="button"
                onClick={() => handleReview(action.rating)}
                disabled={isSubmitting}
                className={`min-h-14 rounded-xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${action.className}`}
              >
                <span>{action.label}</span>
                <span className="mt-1 block font-medium opacity-75">
                  {action.helper}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
