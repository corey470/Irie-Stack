import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const submittedKey = searchParams.get("key") ?? "";
  const expectedKey = process.env.IRIE_STACK_TEST_BYPASS_KEY;

  if (
    process.env.IRIE_STACK_TEST_BYPASS !== "true" ||
    !expectedKey ||
    submittedKey !== expectedKey
  ) {
    return NextResponse.redirect(`${origin}/login?error=test-access`);
  }

  const response = NextResponse.redirect(`${origin}/app`);
  response.cookies.set("iriestack_test_key", expectedKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
