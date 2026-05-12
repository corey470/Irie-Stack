import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { adminClientIsConfigured, createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

type AppUser = Pick<User, "id" | "email">;

export async function getAppContext(): Promise<{
  supabase: SupabaseClient;
  user: AppUser | null;
  isTestBypass: boolean;
}> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return { supabase, user, isTestBypass: false };
  if (!testBypassEnabled()) return { supabase, user: null, isTestBypass: false };
  if (!(await testBypassAccessGranted())) {
    return { supabase, user: null, isTestBypass: false };
  }
  if (!adminClientIsConfigured()) return { supabase, user: null, isTestBypass: false };

  const admin = createAdminClient();
  const fallbackUser = await getFallbackUser(admin);
  return { supabase: admin, user: fallbackUser, isTestBypass: Boolean(fallbackUser) };
}

export function testBypassEnabled() {
  if (process.env.IRIE_STACK_TEST_BYPASS !== "true") return false;
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.IRIE_STACK_TEST_BYPASS_ALLOW_PRODUCTION !== "true"
  ) {
    return false;
  }
  return true;
}

export function testBypassRequiresKey() {
  return Boolean(process.env.IRIE_STACK_TEST_BYPASS_KEY);
}

export async function testBypassAccessGranted() {
  const key = process.env.IRIE_STACK_TEST_BYPASS_KEY;
  if (!key) return true;

  const cookieStore = await cookies();
  return cookieStore.get("iriestack_test_key")?.value === key;
}

export function testBypassEmail() {
  if (!testBypassEnabled()) return null;
  return process.env.IRIE_STACK_TEST_USER_EMAIL ?? null;
}

export function testBypassReady() {
  if (!testBypassEmail()) return false;
  if (!adminClientIsConfigured()) return false;
  return process.env.IRIE_STACK_TEST_BYPASS === "true";
}

async function getFallbackUser(supabase: SupabaseClient): Promise<AppUser | null> {
  const targetEmail = process.env.IRIE_STACK_TEST_USER_EMAIL;
  if (!targetEmail) return null;

  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (error) return null;

  const user = data.users.find((item) => item.email === targetEmail);
  return user ? { id: user.id, email: user.email ?? targetEmail } : null;
}
