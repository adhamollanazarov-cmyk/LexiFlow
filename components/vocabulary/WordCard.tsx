"use client";

import { useState } from "react";

export type VocabularyWord = {
  id: string;
  original: string;
  translation: string;
  context_sentence: string;
  document_name: string;
  created_at: string;
};

type WordCardProps = {
  word: VocabularyWord;
  onDelete: (id: string) => void;
};

function formatWordDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function WordCard({ word, onDelete }: WordCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const formattedDate = formatWordDate(word.created_at);

  return (
    <article className="group relative rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-2xl font-bold tracking-normal text-slate-950">
              {word.original}
            </h2>
            <button
              type="button"
              aria-label={`Listen to ${word.original}`}
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              🔊
            </button>
          </div>
          <p className="mt-1 text-base font-semibold text-[#4F6EF7]">
            {word.translation}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-400">word</p>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-slate-400">
          <button
            type="button"
            aria-label={`Bookmark ${word.original}`}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md transition hover:bg-indigo-50 hover:text-[#4F6EF7]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingDelete((current) => !current)}
            aria-label={`Open menu for ${word.original}`}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-lg leading-none transition hover:bg-slate-50 hover:text-slate-600"
          >
            ⋮
          </button>
        </div>
      </div>

      {isConfirmingDelete ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
          <span className="text-sm font-semibold text-red-700">Delete?</span>
          <button
            type="button"
            onClick={() => onDelete(word.id)}
            className="min-h-11 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(false)}
            className="min-h-11 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            No
          </button>
        </div>
      ) : null}

      {word.context_sentence ? (
        <p className="mt-5 line-clamp-2 text-sm italic leading-6 text-slate-500">
          &quot;{word.context_sentence}&quot;
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {word.document_name ? (
          <span className="min-w-0 truncate text-sm font-medium text-slate-400">
            {word.document_name}
          </span>
        ) : (
          <span />
        )}

        {formattedDate ? (
          <time
            dateTime={word.created_at}
            className="shrink-0 text-sm font-medium text-slate-400"
          >
            {formattedDate}
          </time>
        ) : null}
      </div>
    </article>
  );
}
