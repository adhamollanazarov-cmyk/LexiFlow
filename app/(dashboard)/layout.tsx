"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { ReaderProvider } from "@/context/ReaderContext";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/reader", label: "Reader", icon: "??" },
  { href: "/vocabulary", label: "Vocabulary", icon: "??" },
  { href: "/review", label: "Review", icon: "??" },
  { href: "/settings", label: "Settings", icon: "??" },
];

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const avatarLetter = useMemo(() => {
    return (email.trim()[0] || "U").toUpperCase();
  }, [email]);

  useEffect(() => {
    const supabase = createClient();
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setEmail(session?.user.email ?? "");
    }
    loadSession();
  }, []);

  async function handleLogout() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <ReaderProvider>
      <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-24 md:pb-0">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/reader" className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4F6EF7] text-lg font-bold text-white shadow-sm shadow-indigo-200">
                L
              </span>
              <span className="truncate text-xl font-bold tracking-normal text-slate-950">
                LexiFlow
              </span>
            </Link>

            <nav className="hidden items-center gap-2 rounded-full bg-slate-50 p-1 md:flex">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="flex min-h-11 min-w-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1.5 text-left transition hover:bg-slate-50 disabled:opacity-60 sm:px-2"
              title={isSigningOut ? "Logging out..." : "Logout"}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4F6EF7] text-sm font-bold text-white">
                {avatarLetter}
              </span>
              <span className="hidden max-w-40 truncate text-sm font-medium text-slate-600 sm:block">
                {email || "Loading..."}
              </span>
              <span className="hidden text-slate-400 sm:block">⌄</span>
            </button>
          </div>
        </header>

        <main className="overflow-x-hidden px-4 py-6 sm:px-6 md:py-8">
          {children}
        </main>

        <FeedbackButton />

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-indigo-50 text-[#4F6EF7]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="text-base leading-none">{link.icon}</span>
                  <span className="mt-1">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ReaderProvider>
  );
}

