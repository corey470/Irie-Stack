# 04 — Platform Connectors

This document covers how IrieStack connects to social platforms — the API landscape, the integration strategy per platform, and the fallback patterns when direct API access isn't available.

The honest summary: posting to social platforms via API in 2026 is harder than it should be, varies wildly by platform, and is one of the most thankless parts of building a product like this. We design around that reality rather than pretending it's clean.

---

## Connector strategy by platform

| Platform | API Status (2026) | IrieStack Phase | Approach |
|----------|-------------------|-----------------|----------|
| **X (Twitter)** | Paid API tiers, workable | Phase 2 | Direct integration |
| **LinkedIn** | Restrictive but workable | Phase 3 | Direct integration |
| **Threads** | Meta Threads API, workable | Phase 4 | Direct integration |
| **Instagram** | Business accounts only | Phase 4 | Direct via Meta Graph |
| **TikTok** | Hostile for posting | Phase 4 | Buffer/Publer fallback |
| **YouTube Shorts** | OK via YouTube Data API | Phase 4 | Direct integration |
| **Substack** | No publishing API | Deferred | Email-to-post or manual export |
| **Bluesky** | Open AT Protocol | Phase 4+ | Direct integration |
| **Mastodon** | Open API | Deferred | Low demand, post-launch |

---

## Common connector pattern

Every platform connector implements the same interface:

```typescript
interface PlatformAdapter {
  // Connection lifecycle
  connect(userId: string): Promise<ConnectionResult>;
  disconnect(connectionId: string): Promise<void>;
  refresh(connectionId: string): Promise<void>;

  // Posting
  post(piece: ContentPiece, connection: PlatformConnection): Promise<PostResult>;

  // Metrics (Phase 4)
  getMetrics(postId: string, connection: PlatformConnection): Promise<Metrics>;

  // Health
  testConnection(connection: PlatformConnection): Promise<HealthStatus>;
}
```

Every connector goes through the same data flow:

1. Customer initiates connection from `/app/settings/platforms`
2. OAuth flow opens in a popup or redirect
3. On success, we receive a token (and refresh token if available)
4. Token is encrypted (AES-256-GCM) before storage in `platform_connections.credentials`
5. Encryption key is environment variable, rotated quarterly
6. Connection is marked active, customer returns to settings page

When tokens expire, the connector attempts refresh. If refresh fails, the connection is marked `requires_reauth` and the customer is notified.

---

## X (Twitter) — Phase 2

**API:** X API v2, Basic tier ($200/month) sufficient for v1, Pro tier ($5000/month) needed at scale.

**Authentication:** OAuth 2.0 with PKCE. Scopes: `tweet.read tweet.write users.read offline.access`.

**Posting capabilities:**
- Single tweets ✅
- Threads (sequential post chain) ✅
- Long tweets (Premium accounts only — IrieStack handles both regular and long-form)
- Media attachments (images) ✅
- Polls ❌ (out of scope)
- Quote tweets ❌ (out of scope for v1)

**Rate limits:**
- 500 posts per month per user on Basic tier (the bottleneck — this is the actual cost driver)
- 17 posts per 24 hours per user (we add internal cadence rules well below this)

**Implementation notes:**
- Threads are posted sequentially with each subsequent tweet replying to the previous
- If any tweet in a thread fails, the partial thread is left intact and customer is notified
- Long tweets use the new long-form endpoint; we feature-detect customer's account tier on connection

**Cost note:** X API is the most expensive of the connectors. At scale, we may pass costs through (high-volume customers pay a premium tier). At launch, absorbed.

---

## LinkedIn — Phase 3

**API:** LinkedIn Marketing Developer Platform — restrictive access, requires application approval.

**Authentication:** OAuth 2.0. Scopes: `w_member_social r_liteprofile`.

**Posting capabilities:**
- Personal profile posts ✅
- Company page posts ✅ (requires admin role on the page)
- Image posts ✅
- Article posts (long-form) ❌ (out of scope — different product)
- Video posts ⚠️ (Phase 5 maybe)

**Rate limits:**
- 25 posts per day per member (LinkedIn's limit, well above our internal limit)
- API quotas per app, not per user

**Implementation notes:**
- LinkedIn's API approval process is slow. Apply early in Phase 2 development so it's ready for Phase 3 launch.
- Company page posting requires verifying admin access at connection time.
- Engagement metrics are limited compared to X — we get likes, comments, reshares, but more limited reach data.

**Common gotchas:**
- LinkedIn URLs change format frequently; the connector validates URL format on each post and falls back gracefully
- Personal vs company page selection happens at the platform-connection level, not per-post

---

## Threads — Phase 4

**API:** Meta Threads API. Currently in active rollout.

**Authentication:** OAuth via Meta Business Suite. Scopes: `threads_basic threads_content_publish`.

**Posting capabilities:**
- Text posts ✅
- Image posts ✅
- Reply chains (Threads-style threads) ✅
- Cross-posting from IG ❌ (different feature)

**Rate limits:**
- 250 posts per 24 hours per user (Meta's published limit)

**Implementation notes:**
- Meta's API has shifted multiple times during Threads' rollout — connector is built defensively with feature flags
- Threads accepts 500-character posts (vs X's 280) — formatting from the engine accounts for this

---

## Instagram — Phase 4

**API:** Meta Graph API, Instagram Business / Creator accounts only (this excludes personal accounts).

**Authentication:** OAuth via Meta Business Suite.

**Posting capabilities (v1 scope):**
- Single image posts ✅
- Carousel posts (2-10 images) ✅ — this is the key IG format for IrieStack
- Captions with hashtags ✅
- Story posts ❌ (Phase 5+)
- Reels ❌ (different product entirely)

**Rate limits:**
- 50 posts per 24 hours per Instagram account

**Implementation notes:**
- IG carousels need actual images, not just text — IrieStack generates the storyboard (text + image prompts), customer either provides images or pastes generated image URLs from their image tool of choice (Pixa, Midjourney, etc.)
- For v1, IG support is "carousel storyboard generated, customer assembles in Canva or similar, posts manually OR connects via Buffer"
- Direct posting comes when image generation pipeline is solved (deferred)

---

## TikTok — Phase 4 (via fallback)

**API:** TikTok Content Posting API — restrictive, audit-heavy, requires business application.

**IrieStack approach:** Buffer/Publer integration as fallback rather than direct.

**Why fallback:**
- Direct posting requires extensive TikTok approval and audit
- Most TikTok content is video, which is outside IrieStack's scope
- The text-overlay / caption use cases TikTok supports are better handled by sending to Buffer, where customer's existing scheduling lives

**How it works:**
1. Customer connects Buffer/Publer in `/app/settings/platforms`
2. When IrieStack generates TikTok-format content, instead of posting directly, it pushes to the customer's Buffer queue
3. Customer reviews and posts from Buffer

This is a real product compromise. We're honest about it in the marketing — "TikTok via Buffer" rather than pretending we have direct integration.

---

## YouTube Shorts — Phase 4

**API:** YouTube Data API v3 — workable, free tier sufficient.

**Authentication:** OAuth 2.0.

**Posting capabilities:**
- Title + description for existing videos ✅
- Direct video upload ❌ (Phase 5+, video is out of v1 scope)

**v1 use case:** When customer publishes a YouTube Short manually, IrieStack can generate the title, description, and tags. Posting still happens manually on YouTube.

This is a "draft assistance" connector, not a "post for you" connector — appropriate for a video platform where the actual upload is non-trivial.

---

## Substack — deferred

**API:** Substack does not have a publishing API.

**Workarounds:**
- Email-to-post (Substack accepts emails to a special address that publish as drafts)
- Manual export (IrieStack generates a Substack-formatted draft, customer copy/pastes)

For v1 we don't bother. Customers who use Substack get content from IrieStack via copy/paste like any other unsupported platform. If demand is loud, we add email-to-post in a future phase.

---

## Bluesky / Mastodon / etc. — post-launch

Open-protocol social platforms (AT Protocol, ActivityPub) are friendly to developers but currently low in customer demand for our target audience.

We'll watch the demand signal. If 10%+ of customers are asking for Bluesky integration, we ship it. Bluesky's AT Protocol is straightforward to integrate (much simpler than X's OAuth dance).

---

## The "no API" graceful path

For any platform we don't support directly, the customer experience must still be good:

1. Engine generates content for that platform's format anyway (we know the format conventions even if we can't post directly)
2. Dashboard shows the piece with a clear "[Manual posting]" badge
3. One-click copy button + a "Mark as posted" button so the customer can update their own queue
4. No nagging "upgrade to post automatically" upsells — that's gross

This way, even the unsupported platforms aren't dead weight in the product.

---

## Connector reliability

Platforms break. APIs change. OAuth flows break overnight without warning. The connector layer needs to be defensive.

**Standards every connector follows:**

- **Health checks:** Daily background job tests every active connection. Failures flagged in customer settings page.
- **Graceful degradation:** A failed post never silently disappears. Three retry attempts with exponential backoff, then `failed` status with full error log visible to customer.
- **Reauth flow:** When tokens expire and refresh fails, customer gets a clear "Reconnect [Platform]" prompt — never a vague "something went wrong."
- **Status page (post-launch):** Public status page showing which platform integrations are operational, degraded, or down. Trust signal for prospective customers.

---

## What this isn't

- Not a unified social inbox (no DM management)
- Not engagement automation (no auto-reply, no auto-DM, no follow/unfollow tools)
- Not a content scheduler in the traditional sense (Buffer/Publer style) — IrieStack schedules its own generated content, not arbitrary content from the customer's library
- Not platform analytics (the metrics we pull are for the engine's learning loop, not for customer dashboards)

If a customer wants those things, they pair IrieStack with another tool that does them. We don't try to be everything.
