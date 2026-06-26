"use client";

import { useState } from "react";

export interface FlashCardWord {
  id: string;
  word: string;
  translation: string;
  example_sentence: string | null;
  repetitions: number;
  interval_days: number;
  easiness_factor: number;
}

interface FlashCardProps {
  word: FlashCardWord;
  onRate: (quality: number) => void;
  isSubmitting?: boolean;
}

const ratingActions = [
  {
    label: "Again",
    quality: 1,
    helper: "Needs another pass",
    className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
  {
    label: "Hard",
    quality: 3,
    helper: "Correct, but difficult",
    className:
      "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
  {
    label: "Good",
    quality: 4,
    helper: "Remembered well",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    label: "Easy",
    quality: 5,
    helper: "Instant recall",
    className: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
];

export function FlashCard({
  word,
  onRate,
  isSubmitting = false,
}: FlashCardProps) {
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-400">Front</p>
          <h2 className="mt-2 text-4xl font-bold tracking-normal text-slate-950">
            {word.word}
          </h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-500">
          {word.repetitions} reps
        </span>
      </div>

      {!isAnswerVisible ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm text-slate-500">
            Think of the meaning, then reveal the answer.
          </p>
          <button
            type="button"
            onClick={() => setIsAnswerVisible(true)}
            className="mt-4 min-h-11 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Show answer
          </button>
        </div>
      ) : null}

      {isAnswerVisible ? (
        <>
          <div className="mt-8 rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-400">Back</p>
            <p className="mt-2 text-xl font-semibold text-[#4F6EF7]">
              {word.translation}
            </p>
            {word.example_sentence ? (
              <p className="mt-4 text-sm italic leading-6 text-slate-600">
                &quot;{word.example_sentence}&quot;
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {ratingActions.map((action) => (
              <button
                key={action.quality}
                type="button"
                onClick={() => onRate(action.quality)}
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
      ) : null}
    </article>
  );
}
