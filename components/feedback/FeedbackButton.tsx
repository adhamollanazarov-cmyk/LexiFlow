"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

const MAX_TEXTAREA_LENGTH = 2000;
const MAX_CONTACT_LENGTH = 200;

function trimToLimit(value: string, limit: number) {
  return value.trim().slice(0, limit);
}

export function FeedbackButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [whatWentWrong, setWhatWentWrong] = useState("");
  const [whatShouldImprove, setWhatShouldImprove] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function openFeedback() {
    setIsOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
    void trackEvent("feedback_opened", {
      pagePath: pathname,
    });
  }

  function resetForm() {
    setWhatWentWrong("");
    setWhatShouldImprove("");
    setContact("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const safeWhatWentWrong = trimToLimit(whatWentWrong, MAX_TEXTAREA_LENGTH);
    const safeWhatShouldImprove = trimToLimit(
      whatShouldImprove,
      MAX_TEXTAREA_LENGTH
    );
    const safeContact = trimToLimit(contact, MAX_CONTACT_LENGTH);

    if (!safeWhatWentWrong && !safeWhatShouldImprove) {
      setErrorMessage("Please share at least one piece of feedback.");
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Missing user");
      }

      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        what_went_wrong: safeWhatWentWrong || null,
        what_should_we_improve: safeWhatShouldImprove || null,
        contact: safeContact || null,
        page_path: pathname,
      });

      if (error) {
        throw error;
      }

      resetForm();
      setSuccessMessage("Thanks! Your feedback helps improve LexiFlow.");
      void trackEvent("feedback_submitted", {
        hasContact: Boolean(safeContact),
        pagePath: pathname,
      });
    } catch {
      setErrorMessage("Could not submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openFeedback}
        className="fixed bottom-24 right-4 z-40 min-h-11 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-200 transition hover:border-slate-300 hover:bg-slate-50 md:bottom-5 md:right-5"
      >
        Send feedback
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 px-4 py-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          <button
            type="button"
            aria-label="Close feedback form"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          <form
            onSubmit={handleSubmit}
            className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="feedback-title"
                  className="text-xl font-bold tracking-normal text-slate-950"
                >
                  Send feedback
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Tell us what to improve. Please do not paste document text or
                  private file details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-xl font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Close"
              >
                x
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-700">
                What went wrong?
              </span>
              <textarea
                value={whatWentWrong}
                onChange={(event) => setWhatWentWrong(event.target.value)}
                maxLength={MAX_TEXTAREA_LENGTH}
                rows={4}
                placeholder="Tell us what was confusing, broken, or hard to use..."
                className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#4F6EF7] focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">
                What should we improve?
              </span>
              <textarea
                value={whatShouldImprove}
                onChange={(event) => setWhatShouldImprove(event.target.value)}
                maxLength={MAX_TEXTAREA_LENGTH}
                rows={4}
                placeholder="What would make LexiFlow more useful for you?"
                className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#4F6EF7] focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">
                Your email or Telegram, optional
              </span>
              <input
                type="text"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                maxLength={MAX_CONTACT_LENGTH}
                placeholder="Optional, if you want us to contact you"
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#4F6EF7] focus:ring-4 focus:ring-blue-100"
              />
            </label>

            {errorMessage ? (
              <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-11 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit feedback"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
