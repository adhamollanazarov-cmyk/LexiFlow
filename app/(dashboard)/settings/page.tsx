"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_ROUTES } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type TelegramStatus = {
  connected: boolean;
  chat_id: number | null;
};

type UserSettingsResponse = {
  email?: string;
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
  { label: "Turkish (TR)", value: "TR" },
];

const targetLanguageOptions: LanguageOption[] = [
  { label: "English (EN-US)", value: "EN-US" },
  { label: "Russian (RU)", value: "RU" },
  { label: "German (DE)", value: "DE" },
  { label: "French (FR)", value: "FR" },
  { label: "Spanish (ES)", value: "ES" },
  { label: "Uzbek (UZ)", value: "UZ" },
  { label: "Turkish (TR)", value: "TR" },
];

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [chatIdInput, setChatIdInput] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSavingLanguages, setIsSavingLanguages] = useState(false);
  const [languageMessage, setLanguageMessage] = useState("");
  const [telegramMessage, setTelegramMessage] = useState("");
  const [sourceLang, setSourceLang] = useState("DE");
  const [targetLang, setTargetLang] = useState("RU");

  useEffect(() => {
    async function fetchStatus() {
      const token = await getAuthToken();

      if (!token) {
        setLanguageMessage("Please sign in again to manage settings.");
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
          setEmail(userData?.email ?? "");
          setSourceLang(userData?.source_lang || "DE");
          setTargetLang(userData?.target_lang || "RU");
        }
      } catch {
        setTelegramMessage("Could not load Telegram status.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, []);

  async function handleConnect() {
    const parsedChatId = Number(chatIdInput);

    if (!Number.isInteger(parsedChatId)) {
      setTelegramMessage("Enter a valid Telegram chat ID.");
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      setTelegramMessage("Please sign in again before connecting Telegram.");
      return;
    }

    setIsSending(true);
    setTelegramMessage("");

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
      setTelegramMessage("Telegram connected.");
    } catch {
      setTelegramMessage("Could not connect Telegram. Check your chat ID.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSaveLanguages() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setLanguageMessage("Please sign in again before saving languages.");
      return;
    }

    setIsSavingLanguages(true);
    setLanguageMessage("");

    try {
      const res = await fetch(API_ROUTES.userPreferences, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });

      if (!res.ok) {
        console.error("Settings save error:", res.status, await res.text());
        throw new Error("Could not save language preferences");
      }

      setLanguageMessage("Language preferences saved.");
    } catch {
      setLanguageMessage("Could not save language preferences.");
    } finally {
      setIsSavingLanguages(false);
    }
  }

  async function handleSendTest() {
    const token = await getAuthToken();
    if (!token) {
      setTelegramMessage("Please sign in again before sending test words.");
      return;
    }

    setIsSending(true);
    setTelegramMessage("");

    try {
      const res = await fetch(API_ROUTES.telegramTest, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Could not send test words");
      }

      setTelegramMessage("Test message sent.");
    } catch {
      setTelegramMessage("Could not send test message.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center overflow-x-hidden px-4 text-sm text-slate-600">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl overflow-x-hidden">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-8">
        <section>
          <h1 className="text-xl font-bold text-slate-950">
            Language Preferences
          </h1>

          <div className="mt-6 space-y-5">
            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  Document Language
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-500">
                  Auto-detected
                </span>
              </div>
              <select
                value={sourceLang}
                onChange={(event) => setSourceLang(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-blue-100"
              >
                {sourceLanguageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Translation Language
              </span>
              <select
                value={targetLang}
                onChange={(event) => setTargetLang(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-blue-100"
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
            className="mt-6 min-h-12 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingLanguages ? "Saving..." : "Save preferences"}
          </button>

          {languageMessage ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {languageMessage}
            </p>
          ) : null}
        </section>

        <section className="mt-8 border-t border-slate-100 pt-8">
          <h2 className="text-xl font-bold text-slate-950">
            Daily Word Reviews
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Connect Telegram to receive daily vocabulary reviews
          </p>

          {isConnected ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  Connected ✓
                </span>
                {chatId ? (
                  <p className="mt-2 text-sm text-slate-400">Chat ID: {chatId}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSending}
                className="min-h-12 rounded-xl bg-[#4F6EF7] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send test message"}
              </button>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                type="number"
                value={chatIdInput}
                onChange={(event) => setChatIdInput(event.target.value)}
                placeholder="Telegram chat ID"
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={handleConnect}
                disabled={isSending}
                className="min-h-12 rounded-xl bg-[#4F6EF7] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Connecting..." : "Connect"}
              </button>
            </div>
          )}

          {telegramMessage ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {telegramMessage}
            </p>
          ) : null}
        </section>

        <section className="mt-8 border-t border-slate-100 pt-8">
          <h2 className="text-xl font-bold text-slate-950">Account</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 truncate text-sm text-slate-500">
              {email || "Signed in"}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
