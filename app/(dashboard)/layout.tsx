"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReaderProvider } from "@/lib/reader-context";

const navLinks = [
  { href: "/reader", label: "Reader" },
  { href: "/vocabulary", label: "Vocabulary" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
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
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/reader" className="text-lg font-semibold text-slate-950">
              LexiFlow
            </Link>
            <nav className="flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    pathname === link.href
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <span className="max-w-48 truncate text-sm text-slate-500">
                {email || "Loading..."}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isSigningOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </header>
        <main className="px-6 py-8">{children}</main>
      </div>
    </ReaderProvider>
  );
}
