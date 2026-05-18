const sampleProblem =
  "Write logic that prints the numbers from 1 to 10 using a loop.";

const sampleReasoning =
  "I think I should start a loop at 0 and keep going until it reaches 10.";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              MVPandas
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              SocraticAI
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              A responsible AI tutor that coaches beginner programming
              reasoning without revealing the final answer.
            </p>
          </div>

          <nav aria-label="Main navigation" className="flex gap-2">
            <a
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
              href="#student-coach"
            >
              Student Coach
            </a>
            <a
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
              href="#teacher-report"
            >
              Teacher Report
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1.25fr_0.75fr]">
        <section
          id="student-coach"
          className="rounded-lg bg-white p-6"
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Student Coach
            </p>
            <h2 className="text-2xl font-bold text-slate-950">
              Reason through a coding logic problem
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Phase 1 placeholder. In Phase 2, this form will send the problem
              and student reasoning to the FastAPI coach endpoint.
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">
                Coding logic problem
              </span>
              <textarea
                className="min-h-28 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100"
                defaultValue={sampleProblem}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">
                First reasoning attempt
              </span>
              <textarea
                className="min-h-32 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100"
                defaultValue={sampleReasoning}
              />
            </label>

            <button
              className="w-fit rounded-md bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
              type="button"
            >
              Coach Me
            </button>
          </div>

          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">
              AI coaching response placeholder
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <p>Answer locked: final code will not be shown.</p>
              <p>Guiding question, small hint, reasoning feedback, weak concept, score, and next step will appear here.</p>
            </div>
          </div>
        </section>

        <section
          id="teacher-report"
          className="rounded-lg bg-white p-6"
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Teacher Report
            </p>
            <h2 className="text-2xl font-bold text-slate-950">
              Latest reasoning snapshot
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Phase 1 placeholder. This view will show only the latest session
              report, with no accounts, classes, or analytics dashboard.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Weak concept
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                Loop boundaries
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reasoning score
              </p>
              <p className="mt-2 text-3xl font-bold text-teal-700">72</p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Teacher summary
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                The student understands that repetition needs a loop, but needs
                support with starting values and stopping conditions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
