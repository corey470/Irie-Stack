import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import { approvalBlockReason } from "@/lib/post-eligibility";
import { syncRelayPostForContentPiece } from "@/lib/relay-sync";

type PieceRow = {
  id: string;
  platform: string;
  format: string;
  status: string;
  scheduled_for: string | null;
  validation: { ok?: boolean } | null;
  metadata: {
    mediaType?: string | null;
    mediaAsset?: { url?: string | null } | null;
  } | null;
};

type RequestBody = {
  runId?: string;
  pieceId?: string;
  day?: string;
};

export async function POST(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!body.runId && !body.pieceId) {
    return NextResponse.json(
      { error: "Choose a plan, day, or post to approve." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("content_pieces")
    .select("id, platform, format, status, scheduled_for, validation, metadata")
    .eq("user_id", user.id)
    .in("status", ["draft", "pending_approval"]);

  if (body.pieceId) query = query.eq("id", body.pieceId);
  if (body.runId) query = query.eq("run_id", body.runId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Could not load posts." }, { status: 500 });
  }

  const pieces = ((data ?? []) as PieceRow[]).filter((piece) => {
    if (!body.day) return true;
    if (!piece.scheduled_for) return false;
    return new Date(piece.scheduled_for).toISOString().slice(0, 10) === body.day;
  });

  const eligible = pieces.filter((piece) => canApprove(piece));
  const blocked = pieces.length - eligible.length;

  if (eligible.length === 0) {
    return NextResponse.json(
      {
        error:
          blocked > 0
            ? "These posts still need fixes or images before approval."
            : "No draft posts found to approve.",
        approved: 0,
        blocked,
      },
      { status: 422 }
    );
  }

  const ids = eligible.map((piece) => piece.id);
  const { error: updateError } = await supabase
    .from("content_pieces")
    .update({
      status: "approved",
      approval_status: "approved",
    })
    .eq("user_id", user.id)
    .in("id", ids);

  if (updateError) {
    return NextResponse.json({ error: "Could not approve posts." }, { status: 500 });
  }

  await Promise.all(
    ids.map((pieceId) =>
      syncRelayPostForContentPiece({
        supabase,
        pieceId,
        status: "approved",
        mode: "approval",
      })
    )
  );

  return NextResponse.json({ ok: true, approved: ids.length, blocked });
}

function canApprove(piece: PieceRow) {
  if (piece.validation?.ok === false) return false;
  return !approvalBlockReason(piece);
}
