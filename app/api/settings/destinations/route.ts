import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import { PLATFORM_OPTIONS } from "@/lib/platforms";

type DestinationBody = {
  id?: string;
  platform?: string;
  label?: string;
  external_id?: string;
  external_type?: string;
  posting_strategy?: string;
  access_token_env_key?: string;
  scheduler_profile_id_env_key?: string;
  is_default?: boolean;
};

const EXTERNAL_TYPES = ["profile", "page", "company_page", "scheduler_profile", "publication"];
const POSTING_STRATEGIES = ["direct", "scheduler"];

export async function GET() {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { data, error } = await supabase
    .from("platform_destinations")
    .select(
      "id, platform, label, external_id, external_type, posting_strategy, access_token_env_key, scheduler_profile_id_env_key, is_default, metadata, updated_at"
    )
    .eq("user_id", user.id)
    .order("platform", { ascending: true })
    .order("label", { ascending: true });

  if (error) return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  return NextResponse.json({ destinations: data ?? [] });
}

export async function POST(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: DestinationBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const parsed = parseDestinationBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (parsed.is_default) {
    await supabase
      .from("platform_destinations")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("platform", parsed.platform);
  }

  const { data, error } = await supabase
    .from("platform_destinations")
    .insert({ user_id: user.id, ...parsed })
    .select(
      "id, platform, label, external_id, external_type, posting_strategy, access_token_env_key, scheduler_profile_id_env_key, is_default, metadata"
    )
    .single();

  if (error) return NextResponse.json({ error: "save failed" }, { status: 500 });
  return NextResponse.json({ destination: data });
}

export async function PUT(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: DestinationBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const parsed = parseDestinationBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (parsed.is_default) {
    await supabase
      .from("platform_destinations")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("platform", parsed.platform);
  }

  const { data, error } = await supabase
    .from("platform_destinations")
    .update(parsed)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select(
      "id, platform, label, external_id, external_type, posting_strategy, access_token_env_key, scheduler_profile_id_env_key, is_default, metadata"
    )
    .single();

  if (error) return NextResponse.json({ error: "save failed" }, { status: 500 });
  return NextResponse.json({ destination: data });
}

export async function DELETE(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase
    .from("platform_destinations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "delete failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function parseDestinationBody(body: DestinationBody) {
  const platform = PLATFORM_OPTIONS.find((item) => item.id === body.platform)?.id;
  const label = body.label?.trim();
  const externalType = EXTERNAL_TYPES.includes(body.external_type ?? "")
    ? body.external_type
    : "profile";
  const postingStrategy = POSTING_STRATEGIES.includes(body.posting_strategy ?? "")
    ? body.posting_strategy
    : "direct";

  if (!platform || !label) return { error: "platform and label are required" };

  return {
    platform,
    label,
    external_id: body.external_id?.trim() || null,
    external_type: externalType,
    posting_strategy: postingStrategy,
    access_token_env_key: body.access_token_env_key?.trim() || null,
    scheduler_profile_id_env_key: body.scheduler_profile_id_env_key?.trim() || null,
    is_default: Boolean(body.is_default),
  };
}
