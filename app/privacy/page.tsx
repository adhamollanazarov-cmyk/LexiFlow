import Link from "next/link";

const sections = [
  {
    title: "What stays local",
    items: [
      "Your full PDF or DOCX document is never uploaded.",
      "LexiFlow reads your document locally in your browser.",
      "We do not store your original files.",
      "We do not see your documents."
    ]
  },
  {
    title: "What is sent for translation / explanation",
    items: [
      "When you click a word, LexiFlow may send only the selected word and a short surrounding context to translation or AI explanation services.",
      "The full document is not sent.",
      "The file itself is not sent."
    ]
  },
  {
    title: "Saved vocabulary",
    items: [
      "Words you choose to save are stored in your account.",
      "Saved vocabulary can include the word, translation, short context or example, explanation, and review progress.",
      "This is needed so you can review words later."
    ]
  },
  {
    title: "Daily Review",
    items: [
      "LexiFlow stores review progress such as next review date, review count, and learning level.",
      "This helps show Today's review and flashcards."
    ]
  },
  {
    title: "Analytics",
    items: [
      "LexiFlow may collect basic product analytics such as page views or safe events like reader opened, review started, or export clicked.",
      "Analytics must not include document text, selected word text, filename, email, API keys, or tokens."
    ]
  },
  {
    title: "Your control",
    items: [
      "You can delete saved vocabulary anytime.",
      "Account deletion options may be added later."
    ]
  }
];

const trustSummary = [
  ["Full documents", "Never uploaded"],
  ["File storage", "Not stored by LexiFlow"],
  ["Translation / AI", "Selected word + short context only"],
  ["Vocabulary", "Saved only when you choose to save it"],
  ["Review progress", "Stored to power Daily Review"]
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F6EF7] text-lg font-bold text-white shadow-sm shadow-indigo-200">
              L
            </span>
            <span className="text-xl font-bold tracking-normal text-slate-950">
              LexiFlow
            </span>
          </Link>

          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Privacy-first by design
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-normal text-slate-950 sm:text-5xl">
            Your documents stay on your device.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">
            LexiFlow is built for students and language learners who want help
            reading documents without uploading the document itself.
          </p>

          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="text-base font-bold text-slate-950">
              Short trust summary
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {trustSummary.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-blue-100 bg-white px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold tracking-normal text-slate-950">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4F6EF7]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-500">
            Questions about privacy? This page will stay honest as LexiFlow
            evolves.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
