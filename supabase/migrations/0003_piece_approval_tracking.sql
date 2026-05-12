-- Approval API bridge fields for content pieces.

alter table public.content_pieces
  add column if not exists approval_request_id text,
  add column if not exists approval_status text
    check (approval_status in ('not_requested', 'pending', 'approved', 'rejected', 'expired', 'cancelled'));

create index if not exists content_pieces_approval_request_id_idx
  on public.content_pieces(approval_request_id);
