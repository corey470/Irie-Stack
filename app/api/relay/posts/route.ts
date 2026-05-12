import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppContext } from "@/lib/app-auth";
import { PLATFORMS, type Platform } from "@/lib/content-engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { approvalBlockReason } from "@/lib/post-eligibility";
import { RELAY_STATUSES, validateRelayPost, type RelayMedia } from "@/lib/social-relay";

type RelayPostBody = {
  user_id?: string;
  source_app?: string;
  source_record_id?: string;
  platform?: string;
  destination_id?: string;
  title?: string;
  body?: string;
  media?: RelayMedia[];
  status?: string;
  mode?: string;
  scheduled_for?: string;
  metadata?: Record<string, unknown>;
};

export async function GET() {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { data, error } = await supabase
    .from("social_relay_posts")
    .select(
      "id, source_app, source_record_id, platform, title, body, media, status, mode, scheduled_for, posted_at, posted_url, validation, metadata, destination:platform_destinations(label, external_id)"
    )
    .eq("user_id", user.id)
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: Request) {
  const adminToken = tokenFromHeader(req);
  const expected = process.env.SOCIAL_RELAY_INGEST_TOKEN;
  const isInternal = Boolean(expected && adminToken === expected);

  const context = isInternal ? null : await getAppContext();
  const supabase = isInternal ? createAdminClient() : context!.supabase;
  const userId = isInternal ? null : context!.user?.id;
  if (!isInternal && !userId) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }

  let body: RelayPostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const targetUserId = isInternal ? body.user_id : userId;
  if (!targetUserId) {
    return NextResponse.json({ error: "user_id is required for relay ingest" }, { status: 400 });
  }

  const platform = PLATFORMS.includes(body.platform as Platform)
    ? (body.platform as Platform)
    : null;
  const text = body.body?.trim();
  if (!platform || !text) {
    return NextResponse.json({ error: "platform and body are required" }, { status: 400 });
  }

  const requestedStatus = RELAY_STATUSES.includes(
    body.status as (typeof RELAY_STATUSES)[number]
  )
    ? (body.status as (typeof RELAY_STATUSES)[number])
    : "pending_approval";
  const mode = body.mode === "autopilot" ? "autopilot" : "approval";
  const media = Array.isArray(body.media) ? body.media : [];
  const validation = validateRelayPost({
    platform,
    body: text,
    media,
  });
  const metadata = body.metadata ?? {};
  const blockReason = approvalBlockReason({
    platform,
    metadata,
    media,
  });
  const status =
    requestedStatus === "approved" && (validation.ok === false || blockReason)
      ? "draft"
      : requestedStatus;

  const destinationId =
    body.destination_id ?? (await defaultDestinationId(supabase, targetUserId, platform));

  const { data, error } = await supabase
    .from("social_relay_posts")
    .insert({
      user_id: targetUserId,
      destination_id: destinationId,
      source_app: body.source_app?.trim() || "external",
      source_record_id: body.source_record_id?.trim() || null,
      platform,
      title: body.title?.trim() || "Untitled post",
      body: text,
      media,
      status,
      mode,
      scheduled_for: body.scheduled_for || null,
      validation,
      metadata: {
        ...metadata,
        ...(blockReason ? { ingestBlockedReason: blockReason } : {}),
      },
    })
    .select("id, platform, status, scheduled_for")
    .single();

  if (error) return NextResponse.json({ error: "relay save failed" }, { status: 500 });
  return NextResponse.json({ post: data });
}

async function defaultDestinationId(
  supabase: SupabaseClient,
  userId: string,
  platform: Platform
) {
  const { data } = await supabase
    .from("platform_destinations")
    .select("id")
    .eq("user_id", userId)
    .eq("platform", platform)
    .eq("is_default", true)
    .maybeSingle();

  return data?.id ?? null;
}

function tokenFromHeader(req: Request) {
  const auth = req.headers.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
}
