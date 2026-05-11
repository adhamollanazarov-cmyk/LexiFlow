import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="mb-6 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          🔒 Your files never leave your device
        </div>

        <h1 className="text-5xl font-semibold tracking-normal text-slate-950 sm:text-6xl">
          LexiFlow
        </h1>

        <p className="mt-5 max-w-xl text-xl leading-8 text-slate-600">
          Read any document. Understand every word.
        </p>

        <Link
          href="/login"
          className="mt-10 rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          Get Started
        </Link>
      </section>
    </main>
  );
}
