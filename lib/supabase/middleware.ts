import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate /app routes behind auth — redirect to /login if no session.
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/app") &&
    (!testBypassEnabledForRequest() || !requestHasTestBypassAccess(request))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

function testBypassEnabledForRequest() {
  if (process.env.IRIE_STACK_TEST_BYPASS !== "true") return false;
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.IRIE_STACK_TEST_BYPASS_ALLOW_PRODUCTION !== "true"
  ) {
    return false;
  }
  return true;
}

function requestHasTestBypassAccess(request: NextRequest) {
  const key = process.env.IRIE_STACK_TEST_BYPASS_KEY;
  if (!key) return true;
  return request.cookies.get("iriestack_test_key")?.value === key;
}
