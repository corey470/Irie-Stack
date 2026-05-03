# 03 — The Control Plane

The Control Plane is what turns IrieStack from "another AI content tool" into something a real business owner will actually use. It's the layer of trust controls — the per-platform mode toggle, the approval queue, the Telegram bridge, the kill switches.

This is the differentiator. Most AI content tools force one trust level on the customer (either "we'll post for you, period" or "we'll draft, you copy/paste"). IrieStack lets the customer dial trust per platform, per piece, with real-time overrides.

---

## The two modes

### Autopilot mode

When a platform is set to autopilot:
- Pieces generated for that platform skip the approval queue
- They're scheduled directly into the posting queue
- They post automatically at their scheduled time
- The customer sees them after they're posted, not before

Use case: low-stakes platforms where the customer trusts the engine and wants high volume. Typical autopilot platforms: X (Twitter), Threads. Sometimes LinkedIn for confident customers.

### Approval mode

When a platform is set to approval:
- Pieces generated for that platform land in `pending_approval` status
- Customer is notified (web + Telegram, both optional)
- Each piece must be explicitly approved before it posts
- Customer can edit, reject, or reschedule before approving

Use case: high-stakes platforms where mistakes matter. Typical approval platforms: LinkedIn (professional reputation), client-facing accounts, brand accounts.

---

## The toggle UI

Per-platform mode lives in `/app/settings/platforms`. The page shows each connected platform as a row:

```
┌─────────────────────────────────────────────────────┐
│ X (Twitter)               [●  Autopilot  ○  Approval]│
│ Connected as @coreyirie • Last post 2 hours ago     │
├─────────────────────────────────────────────────────┤
│ LinkedIn                  [○  Autopilot  ●  Approval]│
│ Connected as Corey S. • Last post yesterday         │
├─────────────────────────────────────────────────────┤
│ Threads                   [Connect →]                │
└─────────────────────────────────────────────────────┘
```

Important UX rules:

1. **The toggle is the most prominent control on the page.** No one should have to hunt for it.
2. **Switching to autopilot for the first time on any platform requires an explicit confirmation modal.** "You're about to enable autopilot on X. IrieStack will post directly without your review. Continue?" with a checkbox to dismiss future prompts on this platform.
3. **A "Pause All" kill switch lives in a prominent position** in the dashboard top bar, not buried in settings. One click stops all queued posts immediately.

---

## The approval queue

`/app/queue` is where approval-mode pieces live until acted on.

### Layout

The queue is a list view, not a grid. Each row:

```
┌──────────────────────────────────────────────────────────────┐
│ [LinkedIn] post • drafted 12 min ago • voice score 84/100   │
│                                                              │
│ "Most CRMs are designed for the manager, not the person      │
│  doing the work. That's why your driver hates pulling out    │
│  their phone to log a job. The interface treats them like   │
│  a data entry clerk — but they're closing deals."            │
│                                                              │
│  [Edit]  [Reject]  [Approve]  [Schedule for later ▼]         │
└──────────────────────────────────────────────────────────────┘
```

### Actions

**Approve:** Piece moves to `approved` status. Scheduler picks the next available post slot and queues it.

**Reject:** Piece moves to `rejected` status. Logged to `approvals_log` with optional reason. Customer can write a reason ("too jargon-y", "wrong audience", etc.) — these reasons are useful Phase 4 signal.

**Edit:** Opens an inline editor. Customer can rewrite the piece. On save, the piece updates and re-runs through Voice Validator (lightweight pass — no auto-revise, just a fresh score). Then customer hits Approve to send it forward.

**Schedule for later:** Approves the piece but lets the customer pick a specific post time instead of the auto-scheduled slot.

### Bulk actions

When a generation produces 15+ pieces, individual approval is friction. Bulk actions help:

- **Select all** / **Select none**
- **Approve selected** (with confirmation: "Approve all 8 selected pieces?")
- **Reject selected**
- **Filter by platform** (review all LinkedIn pieces in one pass, then move to X)
- **Filter by voice score** (e.g., "show me only pieces below 80 — those need attention")

Bulk approve is the most-used action by power users. It needs to feel safe. The confirmation step is non-skippable for bulk approve in approval mode.

---

## The Telegram bridge

Telegram is the primary mobile-friendly approval surface. It's faster than the web app for quick approvals and matches Corey's existing Telegram-as-control-plane pattern.

### Pairing

In `/app/settings/notifications`:
1. Customer clicks "Connect Telegram"
2. App generates a one-time pairing code
3. Customer opens the IrieStack bot in Telegram, sends `/pair CODE`
4. Bot binds the Telegram user ID to the customer's account
5. Pairing complete — confirmation in both surfaces

### Notifications

When a piece lands in `pending_approval` and the customer has Telegram paired with notifications enabled, the bot sends:

```
🟡 Pending approval — LinkedIn post

"Most CRMs are designed for the manager, not the person doing
the work. That's why your driver hates pulling out their phone
to log a job. The interface treats them like a data entry clerk
— but they're closing deals."

Voice score: 84/100
Source: Repurpose from "Newsletter #47"

[ Approve ]  [ Reject ]  [ Edit ]  [ View in app ]
```

Inline buttons handle the common actions. Approve and Reject act immediately. Edit opens a thread where the customer can reply with a revised version, which the bot routes back to the app. View in app deep-links to the queue.

### Notification batching

Critical UX detail: if a generation produces 15 pieces, we DO NOT send 15 Telegram notifications. We send one summary message:

```
🟡 12 new pieces pending approval

LinkedIn (5)  •  X (4)  •  Threads (3)

[ Review all ]  [ Approve all autopilot-eligible ]
```

The customer hits "Review all" to be deep-linked to the queue, or "Approve all autopilot-eligible" to bulk approve via Telegram (with confirmation).

### Notification settings

Per-customer toggles in `/app/settings/notifications`:

- All approvals (default ON)
- Posting confirmations (default OFF — reduces noise)
- Performance milestones (Phase 4 — "Your tweet from Tuesday hit 10k impressions")
- Drift warnings (default ON)
- Quiet hours (default 10pm–7am customer's local time)

---

## Kill switches

Things will go wrong. The product needs unmistakable, immediate ways to stop everything.

### Pause All

A button in the dashboard top bar (next to the customer's avatar). Always visible, never hidden behind a menu.

When clicked:
- All pieces in `approved` status (queued to post but not yet posted) → flipped to `paused`
- All `pending_approval` pieces stay where they are
- All future generations land in `pending_approval` regardless of platform mode
- A banner appears across the top of the app: "All posting paused. [Resume] [Settings]"

When resumed:
- `paused` pieces flip back to `approved` and scheduling resumes
- Banner disappears
- Platform modes resume their previous values

This is the panic button. It works in 1 click. No confirmation modal — confirmation modals on emergency controls are the wrong call.

### Per-platform pause

In platform settings, each platform has a "Pause this platform" option. Same logic as Pause All but scoped to one platform. Useful when X breaks but LinkedIn is fine.

### Per-piece kill

Any approved piece in the queue (status `approved`, scheduled but not yet posted) can be canceled with one click. Not edited, not held — canceled outright.

This handles the "wait, that piece references something I just deleted from the source" emergency.

### Posting after-the-fact

If a piece has already posted (status `posted`), IrieStack cannot un-post it. We can flag it for the customer's attention and provide a one-click deep-link to delete it manually on the platform, but the actual deletion is the customer's action on the platform itself.

We do NOT store platform credentials with delete permissions where the API allows it. The blast radius of a bug that auto-deletes content is too high. Manual deletion only.

---

## Audit log

Every meaningful action is logged for the customer's own visibility:

`/app/audit` shows a chronological feed:

- Stack edited (with diff)
- Generation triggered
- Piece approved / rejected / edited
- Platform mode changed
- Posting paused / resumed
- Piece posted (with platform URL)
- Voice threshold changed

The log is read-only. It's for the customer to investigate "wait, what happened?" moments. Especially important for autopilot users who don't watch every piece.

---

## Trust escalation patterns

A pattern we expect to see, and design around:

**Week 1:** Customer connects platforms in approval mode. Reviews everything. Builds trust by watching the engine produce good pieces.

**Week 2-4:** Customer starts approving in bulk. Notices that >90% of pieces pass without edits.

**Month 2:** Customer flips low-stakes platform (typically X) to autopilot. Continues to review LinkedIn manually.

**Month 3+:** Customer settles into a permanent mix: autopilot on X and Threads, approval on LinkedIn. Or some other mix that fits their psychology.

The product encourages this arc but doesn't push it. We never auto-prompt "you've approved 50 LinkedIn posts in a row, want to flip to autopilot?" — that's manipulative. Customers should escalate trust on their own schedule.

What we DO prompt: drift warnings ("voice has been flagged on 4 of your last 10 generations") and posting failures ("X integration failed 3 times today, would you like to pause posting on X?"). These are about safety, not engagement.

---

## What this isn't

- **Not a content moderation system.** We don't filter for offensive content. The customer's voice is the customer's voice.
- **Not a fact-checker.** Generate mode does light research, but if the customer's source has wrong information, we'll faithfully repurpose it.
- **Not a compliance system.** Industries with regulatory content requirements (financial services, healthcare, legal) need their own review layer. We're not that layer.

If a customer needs any of these, IrieStack is not the right product for them. That's an honest filter, not a limitation we'll grow into.
