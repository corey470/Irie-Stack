# Irie Social Relay

Irie Social Relay is the shared posting queue for Irie products. It is the in-house Buffer/Publer layer.

## Where It Lives

Host app: `irie-stack`

Current Vercel app URL:

```text
https://irie-stack.vercel.app
```

Dashboard:

```text
https://irie-stack.vercel.app/app/relay
```

Health check:

```text
GET https://irie-stack.vercel.app/api/relay/health
```

Post intake:

```text
POST https://irie-stack.vercel.app/api/relay/posts
```

Posting worker:

```text
GET https://irie-stack.vercel.app/api/agents/relay/run
```

## What Other Irie Apps Need

Each app that sends posts to the relay needs three values:

```env
IRIE_SOCIAL_RELAY_URL="https://irie-stack.vercel.app/api/relay/posts"
IRIE_SOCIAL_RELAY_TOKEN=""
IRIE_SOCIAL_RELAY_USER_ID=""
```

`IRIE_SOCIAL_RELAY_TOKEN` must match `SOCIAL_RELAY_INGEST_TOKEN` in IrieStack.

`IRIE_SOCIAL_RELAY_USER_ID` is the owner account in IrieStack that should receive the queued post.

## Submit A Post

```bash
curl -X POST "$IRIE_SOCIAL_RELAY_URL" \
  -H "authorization: Bearer $IRIE_SOCIAL_RELAY_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "user_id": "'"$IRIE_SOCIAL_RELAY_USER_ID"'",
    "source_app": "irie-commerce",
    "source_record_id": "product-123",
    "platform": "facebook",
    "title": "New product launch",
    "body": "New drop is live. Built for everyday movement.",
    "status": "pending_approval",
    "mode": "approval",
    "scheduled_for": "2026-05-05T14:00:00.000Z",
    "metadata": {
      "campaign": "spring-drop"
    }
  }'
```

## Accepted Platforms

```text
x
linkedin
threads
instagram
facebook
tiktok
substack
```

## Accepted Statuses

Use `pending_approval` when a human should review first.

Use `approved` when the post is already approved and can publish when due.

```text
draft
pending_approval
approved
scheduled
posted
rejected
failed
```

## Current Rules

- The relay stores post text, destination, schedule time, source app, and posting receipts.
- Platform credentials stay in environment variables, not in the database.
- Posting only works after the platform destination and token are configured.
- The relay worker runs from Vercel cron every 15 minutes.
- The dashboard is at `/app/relay`.

## First Client Apps

Planned order:

1. `irie-stack`
2. `ziggy-dashboard`
3. `irie-commerce`
4. `irie-transportation`
