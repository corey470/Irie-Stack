import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let email: string;
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid email." },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase.from("waitlist").insert({ email });

  if (error) {
    // Unique-violation (already on the list) — treat as success, no leak.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true });
    }
    console.error("waitlist insert failed:", error);
    return NextResponse.json(
      { error: "Couldn't add you to the list. Try again?" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
