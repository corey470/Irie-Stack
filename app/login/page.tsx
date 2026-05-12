import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { testBypassEmail, testBypassReady } from "@/lib/app-auth";

export default function LoginPage() {
  const bypassEmail = testBypassEmail();
  const bypassReady = testBypassReady();

  return (
    <main className="min-h-screen bg-bg-marketing flex flex-col">
      <header className="container-shell pt-6 sm:pt-8">
        <Link
          href="/"
          className="font-display text-[clamp(1.25rem,2vw,1.5rem)] tracking-tight text-text-primary"
        >
          IrieStack
        </Link>
      </header>

      <div className="container-shell flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-text-primary">
              Sign in
            </h1>
            <p className="mt-3 text-text-secondary">
              Use your password, Google, or the temporary testing access while
              IrieStack is still in build mode.
            </p>
          </div>
          {bypassReady && bypassEmail && (
            <div className="mb-5 rounded-lg border border-accent/30 bg-accent/10 p-5 text-left shadow-card">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">
                Testing access
              </p>
              <h2 className="mt-2 text-lg font-semibold text-text-primary">
                Skip email login for now.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Open the cockpit as{" "}
                <span className="font-medium text-text-primary">
                  {bypassEmail}
                </span>
                . This is temporary while we test the product.
              </p>
              <Link
                href="/app"
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-accent-light"
              >
                Continue to IrieStack
              </Link>
            </div>
          )}
          {!bypassReady && bypassEmail && (
            <div className="mb-5 rounded-lg border border-warning/30 bg-warning/10 p-5 text-left shadow-card">
              <p className="text-sm leading-relaxed text-text-secondary">
                Testing access is partly configured, but the app cannot use it
                yet. Check that the Supabase service role key exists in Vercel.
              </p>
            </div>
          )}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
