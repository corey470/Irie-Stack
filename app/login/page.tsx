import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
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
              We'll email you a link. No password to remember.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
