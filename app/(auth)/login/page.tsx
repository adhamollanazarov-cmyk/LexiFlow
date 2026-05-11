import { LoginButton } from "@/components/auth/LoginButton";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-sm text-center">
        <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-md bg-slate-950 text-lg font-semibold text-white">
          L
        </div>

        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          LexiFlow
        </h1>

        <div className="mt-8">
          <LoginButton />
        </div>
      </section>
    </main>
  );
}
