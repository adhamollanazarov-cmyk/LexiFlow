"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { ReaderProvider } from "@/context/ReaderContext";
import { createClient } from "@/lib/supabase/client";

type NavIconName = "reader" | "vocabulary" | "review" | "settings";

const navLinks = [
  { href: "/reader", label: "Reader", icon: "reader" },
  { href: "/vocabulary", label: "Vocabulary", icon: "vocabulary" },
  { href: "/review", label: "Review", icon: "review" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ name }: { name: NavIconName }) {
  const commonProps = {
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "reader") {
    return (
      <svg {...commonProps}>
        <path d="M12 7v14" />
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v19H7.5A3.5 3.5 0 0 0 4 17.5v-12Z" />
        <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v19h4.5a3.5 3.5 0 0 1 3.5-3.5v-12Z" />
      </svg>
    );
  }

  if (name === "vocabulary") {
    return (
      <svg {...commonProps}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
      </svg>
    );
  }

  if (name === "review") {
    return (
      <svg {...commonProps}>
        <path d="M3 12a9 9 0 0 1 15.3-6.4" />
        <path d="M18 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15.3 6.4" />
        <path d="M6 21v-5h5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

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
                  <NavIcon name={link.icon as NavIconName} />
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

