"use client";

import { useEffect, useState } from "react";
import { API_ROUTES } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type TelegramStatus = {
  connected: boolean;
  chat_id: number | null;
};

type UserSettingsResponse = {
  source_lang?: string;
  target_lang?: string;
};

type LanguageOption = {
  label: string;
  value: string;
};

const sourceLanguageOptions: LanguageOption[] = [
  { label: "English (EN-US)", value: "EN-US" },
  { label: "Russian (RU)", value: "RU" },
  { label: "German (DE)", value: "DE" },
  { label: "French (FR)", value: "FR" },
  { label: "Spanish (ES)", value: "ES" },
];

const targetLanguageOptions: LanguageOption[] = [
  { label: "English (EN-US)", value: "EN-US" },
  { label: "Russian (RU)", value: "RU" },
  { label: "German (DE)", value: "DE" },
  { label: "French (FR)", value: "FR" },
  { label: "Spanish (ES)", value: "ES" },
  { label: "Uzbek (UZ)", value: "UZ" },
];

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export default function SettingsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [chatIdInput, setChatIdInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSavingLanguages, setIsSavingLanguages] = useState(false);
  const [message, setMessage] = useState("");
  const [sourceLang, setSourceLang] = useState("DE");
  const [targetLang, setTargetLang] = useState("RU");

  useEffect(() => {
    async function fetchStatus() {
      const token = await getAuthToken();

      if (!token) {
        setMessage("Please sign in again to manage Telegram settings.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(API_ROUTES.telegramStatus, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userRes = await fetch(API_ROUTES.userMe, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Could not load Telegram status");
        }

        const data = (await res.json()) as TelegramStatus | null;
        setIsConnected(Boolean(data?.connected));
        setChatId(data?.chat_id ?? null);

        if (userRes.ok) {
          const userData = (await userRes.json()) as UserSettingsResponse | null;
          setSourceLang(userData?.source_lang || "DE");
          setTargetLang(userData?.target_lang || "RU");
        }
      } catch {
        setMessage("Could not load Telegram status.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, []);

  async function handleConnect() {
    const parsedChatId = Number(chatIdInput);

    if (!Number.isInteger(parsedChatId)) {
      setMessage("Enter a valid Telegram chat ID.");
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      setMessage("Please sign in again before connecting Telegram.");
      return;
    }

    setIsSending(true);
    setMessage("");

    try {
      const res = await fetch(API_ROUTES.telegramConnect, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: parsedChatId }),
      });

      if (!res.ok) {
        throw new Error("Could not connect Telegram");
      }

      setIsConnected(true);
      setChatId(parsedChatId);
      setMessage("Telegram connected.");
    } catch {
      setMessage("Could not connect Telegram. Check your chat ID and bot token.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSaveLanguages() {
    const token = await getAuthToken();
    if (!token) {
      setMessage("Please sign in again before saving languages.");
      return;
    }

    setIsSavingLanguages(true);
    setMessage("");

    try {
      const res = await fetch(API_ROUTES.userPreferences, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });

      if (!res.ok) {
        throw new Error("Could not save language preferences");
      }

      setMessage("Language preferences saved.");
    } catch {
      setMessage("Could not save language preferences.");
    } finally {
      setIsSavingLanguages(false);
    }
  }

  async function handleSendTest() {
    const token = await getAuthToken();
    if (!token) {
      setMessage("Please sign in again before sending test words.");
      return;
    }

    setIsSending(true);
    setMessage("");

    try {
      const res = await fetch(API_ROUTES.telegramTest, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Could not send test words");
      }

      setMessage("Test words sent to Telegram.");
    } catch {
      setMessage("Could not send test words. Make sure Telegram is connected.");
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        Loading Telegram settings...
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Language preferences
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose the document language and the language LexiFlow translates
            into.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">
              Source language
            </span>
            <select
              value={sourceLang}
              onChange={(event) => setSourceLang(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            >
              {sourceLanguageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">
              Target language
            </span>
            <select
              value={targetLang}
              onChange={(event) => setTargetLang(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            >
              {targetLanguageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={handleSaveLanguages}
          disabled={isSavingLanguages}
          className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSavingLanguages ? "Saving..." : "Save languages"}
        </button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {isConnected ? (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                ✅ Telegram connected
              </h1>
              <p className="mt-2 text-sm text-slate-600">Chat ID: {chatId}</p>
              <p className="mt-1 text-sm text-slate-600">
                You receive daily words at 9:00 UTC
              </p>
            </div>
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSending}
              className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? "Sending..." : "Send test words now"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                📱 Connect Telegram Bot
              </h1>
              <ol className="mt-4 space-y-2 text-sm text-slate-600">
                <li>Step 1: Open Telegram and find @YOUR_BOT_USERNAME</li>
                <li>Step 2: Send /start to the bot</li>
                <li>Step 3: The bot will ask for your User ID</li>
                <li>Step 4: Enter your User ID below</li>
              </ol>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="number"
                value={chatIdInput}
                onChange={(event) => setChatIdInput(event.target.value)}
                placeholder="Telegram chat ID"
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="button"
                onClick={handleConnect}
                disabled={isSending}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Connecting..." : "Connect"}
              </button>
            </div>

            <p className="text-sm text-slate-500">
              Don't know your chat ID? Message @userinfobot on Telegram to get
              your ID.
            </p>
          </div>
        )}

        {message ? (
          <p className="mt-5 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {message}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">How it works</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Every morning at 9:00 UTC, LexiFlow sends you 5 words from your recent
          reading sessions. Review them in Telegram to build your vocabulary
          faster.
        </p>
      </section>
    </div>
  );
}
