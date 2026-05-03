"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function onClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors duration-150"
    >
      Sign out
    </button>
  );
}
