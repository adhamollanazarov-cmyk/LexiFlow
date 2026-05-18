import Link from "next/link";

const featurePills = [
  {
    icon: "🛡️",
    title: "100% Private",
    text: "Files stay on your device",
  },
  {
    icon: "📖",
    title: "Smart Vocabulary",
    text: "Save words and see them in context",
  },
  {
    icon: "⚡",
    title: "Faster Understanding",
    text: "Read more. Learn more. Remember more.",
  },
];

const footerFeatures = [
  {
    icon: "🛡️",
    title: "Private by design",
    text: "Your files stay on your device. We never see your documents.",
  },
  {
    icon: "⚡",
    title: "Built for focus",
    text: "Clean reading experience that keeps you in flow.",
  },
  {
    icon: "📖",
    title: "Vocabulary that sticks",
    text: "Save words in context and review them anytime.",
  },
  {
    icon: "✨",
    title: "Modern & intuitive",
    text: "A beautiful experience that works effortlessly.",
  },
];

const avatars = [
  { initials: "AR", className: "bg-indigo-100 text-indigo-700" },
  { initials: "MK", className: "bg-sky-100 text-sky-700" },
  { initials: "SL", className: "bg-emerald-100 text-emerald-700" },
  { initials: "JP", className: "bg-violet-100 text-violet-700" },
  { initials: "ND", className: "bg-amber-100 text-amber-700" },
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

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 text-center sm:px-8 sm:pb-20 sm:pt-20">
          <div className="mx-auto inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            🔒 Your files never leave your device
          </div>

          <h1 className="mx-auto mt-7 max-w-3xl text-3xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
            Read any document.
            <br />
            Understand{" "}
            <span className="text-[#4F6EF7]">every word.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            LexiFlow helps you read with confidence, save new words, and truly
            understand what you read.
          </p>

          <div className="mt-9 flex justify-center">
            <Link
              href="/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-slate-300 transition hover:bg-slate-800 sm:w-auto"
            >
              Get Started →
            </Link>
          </div>

          <div className="relative mx-auto mt-14 h-44 max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-100 sm:h-56">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,110,247,0.16),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(34,197,94,0.12),transparent_24%),linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)]" />
            <svg
              className="absolute inset-x-0 bottom-0 h-full w-full"
              viewBox="0 0 900 260"
              fill="none"
              role="img"
              aria-label="Abstract blue wave illustration"
            >
              <path
                d="M0 190C90 148 163 212 254 174C346 136 397 72 494 119C598 170 655 215 752 162C813 129 852 116 900 122V260H0V190Z"
                fill="url(#waveOne)"
              />
              <path
                d="M0 214C114 156 185 232 293 187C394 145 456 119 545 158C646 203 721 199 811 150C849 129 878 124 900 128V260H0V214Z"
                fill="url(#waveTwo)"
              />
              <path
                d="M0 206C106 171 190 236 303 199C414 163 489 132 589 178C694 226 790 175 900 166"
                stroke="#4F6EF7"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.22"
              />
              <defs>
                <linearGradient id="waveOne" x1="0" x2="900" y1="110" y2="226">
                  <stop stopColor="#DBEAFE" />
                  <stop offset="0.48" stopColor="#93C5FD" />
                  <stop offset="1" stopColor="#C4B5FD" />
                </linearGradient>
                <linearGradient id="waveTwo" x1="0" x2="900" y1="146" y2="250">
                  <stop stopColor="#E0F2FE" />
                  <stop offset="0.5" stopColor="#60A5FA" stopOpacity="0.72" />
                  <stop offset="1" stopColor="#4F6EF7" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {featurePills.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
              >
                <div className="text-2xl">{feature.icon}</div>
                <h2 className="mt-3 text-sm font-bold text-slate-950">
                  {feature.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 flex max-w-3xl flex-col flex-wrap items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 text-center shadow-sm sm:flex-row sm:gap-6">
            <p className="text-sm font-medium text-slate-500">
              Trusted by readers worldwide
            </p>
            <div className="flex -space-x-2">
              {avatars.map((avatar) => (
                <span
                  key={avatar.initials}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-sm font-bold ${avatar.className}`}
                >
                  {avatar.initials}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-400">★★★★★</span>
              <span className="font-bold text-slate-950">4.9</span>
              <span className="text-slate-500">from 1,200+ users</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-10 sm:px-8 lg:grid-cols-4">
          {footerFeatures.map((feature) => (
            <div key={feature.title} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-2xl">{feature.icon}</div>
              <h3 className="mt-3 text-sm font-bold text-slate-950">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
