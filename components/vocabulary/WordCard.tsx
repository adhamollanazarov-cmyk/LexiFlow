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
    <article className="group relative rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="pr-16">
        <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
          {word.original}
        </h2>
        <p className="mt-1 text-base font-medium text-slate-500">
          {word.translation}
        </p>
      </div>

      <div className="absolute right-4 top-4">
        {isConfirmingDelete ? (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1">
            <span className="text-xs font-semibold text-red-700">Sure?</span>
            <button
              type="button"
              onClick={() => onDelete(word.id)}
              className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="rounded bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            aria-label={`Delete ${word.original}`}
            className="rounded-md p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-200 group-hover:opacity-100"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v5" />
              <path d="M14 11v5" />
            </svg>
          </button>
        )}
      </div>

      {word.context_sentence ? (
        <p className="mt-5 line-clamp-2 text-sm italic leading-6 text-slate-500">
          {word.context_sentence}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {word.document_name ? (
          <span className="max-w-full truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {word.document_name}
          </span>
        ) : (
          <span />
        )}

        {formattedDate ? (
          <time
            dateTime={word.created_at}
            className="text-xs font-medium text-slate-400"
          >
            {formattedDate}
          </time>
        ) : null}
      </div>
    </article>
  );
}
