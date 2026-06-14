import Link from "next/link";

const featurePills = [
  {
    label: "Local",
    title: "Open PDF/DOCX",
    text: "Read academic documents directly in your browser."
  },
  {
    label: "Click",
    title: "Translate hard words",
    text: "Click difficult words when you get stuck."
  },
  {
    label: "Review",
    title: "Build vocabulary",
    text: "Save words and review them later with flashcards."
  }
];

const howItWorksSteps = [
  "Open your PDF or DOCX",
  "Click a difficult word",
  "Get translation and simple explanation",
  "Save it to Vocabulary",
  "Review with Daily Review"
];

const footerFeatures = [
  {
    title: "Your document stays private",
    text: "LexiFlow reads your document locally in your browser."
  },
  {
    title: "Translation when you ask",
    text: "Only the selected word and short context are sent for help."
  },
  {
    title: "Vocabulary that sticks",
    text: "Save words in context and review them when they are due."
  },
  {
    title: "Built for learners",
    text: "Designed for students reading foreign-language academic PDFs."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F6EF7] text-lg font-bold text-white shadow-sm shadow-indigo-200">
              L
            </span>
            <span className="text-xl font-bold tracking-normal text-slate-950">
              LexiFlowAI
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="hidden min-h-11 items-center px-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950 sm:flex"
            >
              Privacy
            </Link>
            <Link
              href="/login"
              className="flex min-h-11 items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 text-center sm:px-8 sm:pb-20 sm:pt-20">
          <div className="mx-auto inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#4F6EF7]">
            Private PDF reader for language learners
          </div>

          <h1 className="mx-auto mt-7 max-w-4xl text-3xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
            Read English PDFs
            <br />
            <span className="text-[#4F6EF7]">without getting stuck.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            Click any word to translate, understand, and save it. Your document
            stays on your device.
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-slate-600">
            For students reading academic PDFs in a foreign language.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-slate-300 transition hover:bg-slate-800 sm:w-auto"
            >
              Start reading
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
            >
              View privacy
            </Link>
          </div>

          <div className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-blue-100">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-left">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-300" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-300" />
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Local document
                </span>
              </div>

              <div className="grid gap-4 bg-slate-50 p-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-950">
                      Academic PDF
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[#4F6EF7]">
                      Browser only
                    </span>
                  </div>
                  <div className="space-y-3 text-sm leading-7 text-slate-500">
                    <p>
                      Students often lose momentum when a single word blocks
                      the whole paragraph.
                    </p>
                    <p>
                      <span className="rounded-md bg-blue-100 px-1.5 py-1 font-semibold text-[#4F6EF7]">
                        Unfortunately
                      </span>
                      , academic texts can make simple ideas feel difficult.
                    </p>
                    <p>
                      LexiFlowAI keeps the document local and helps only with
                      the word you choose.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="rounded-lg bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white">
                      Translation
                    </span>
                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-500">
                      AI Explain
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-bold text-slate-950">
                    Unfortunately
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#4F6EF7]">
                    Translation appears here
                  </p>
                  <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-500">
                    Get a simple explanation, then save the word for Daily
                    Review.
                  </p>
                  <button
                    type="button"
                    className="mt-4 min-h-11 w-full rounded-xl bg-[#4F6EF7] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Save to Vocabulary
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {featurePills.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-[#4F6EF7]">
                  {feature.label}
                </div>
                <h2 className="mt-3 text-sm font-bold text-slate-950">
                  {feature.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              A focused reading flow for foreign-language PDFs and class
              materials.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {howItWorksSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4F6EF7] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-bold leading-6 text-slate-950">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
              Your document stays private.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              LexiFlow reads your document locally in your browser. We only send
              the selected word and short context when you ask for translation
              or AI explanation.
            </p>
            <Link
              href="/privacy"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Read the privacy page
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {footerFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-sm font-bold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 text-center sm:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-10 shadow-sm">
            <h2 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
              For students, language learners, and anyone reading academic PDFs
              in a foreign language.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
              LexiFlowAI is for the moment when you understand the topic, but a
              few difficult words slow you down.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#4F6EF7] px-7 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-indigo-600"
              >
                Start reading
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-7 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row sm:px-8">
          <p className="text-sm font-medium text-slate-500">
            LexiFlowAI - private document reading for language learners.
          </p>
          <Link
            href="/privacy"
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            Privacy
          </Link>
        </div>
      </footer>
    </main>
  );
}
