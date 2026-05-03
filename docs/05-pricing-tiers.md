# 05 — Pricing & Tiers

This document outlines the pricing structure for IrieStack — three tiers (Starter / Growth / Scale) matching the existing Irie Commerce pattern, plus a free trial, plus the cost-control mechanics that keep margins healthy.

The pricing isn't finalized — actual numbers are drafts pending real cost data from Phase 1/2 usage. The structure is the part that matters and locks in here.

---

## Pricing philosophy

Three principles drive the pricing structure:

**1. Usage-aligned, not feature-gated.**
We don't lock features behind tiers. Voice Validator, Telegram bridge, autopilot — every customer gets every feature. What scales by tier is *volume* (generations per month, platforms connected, autopilot enabled or not). Feature-gating breeds upgrade resentment; volume-gating breeds upgrade desire.

**2. Cost-aware on AI spend.**
AI generation is real, variable cost. Every tier has a usage cap in dollars of AI cost (not request count). When a customer hits the cap, they know exactly what they're being limited by — not a black-box quota.

**3. Tier ladder reflects business maturity.**
Starter = "I'm trying this." Growth = "This is part of my business." Scale = "This is core infrastructure for my business." Pricing maps to the customer's relationship with the product, not arbitrary thresholds.

---

## The tiers

### Starter — $X/month (TBD, draft: $29/mo)

**Who it's for:** Solo operators trying the product. Single platform use case. Light volume.

**Limits:**
- 1 connected platform
- Approval mode only (no autopilot)
- 30 generations per month (where 1 generation = 1 Repurpose or 1 Generate run, regardless of how many pieces it produces)
- AI cost cap: $15/month inclusive
- 1 Context Stack
- Web dashboard only (no Telegram bridge)
- 7-day content history

**What's NOT in Starter:**
- Autopilot mode
- Multiple platform connections
- Telegram approvals
- Pipeline mode (Phase 4)

### Growth — $X/month (TBD, draft: $79/mo)

**Who it's for:** Active solo creators / small business owners running content as a real channel.

**Limits:**
- Up to 5 connected platforms
- Autopilot AND approval mode (per-platform toggle)
- 150 generations per month
- AI cost cap: $50/month inclusive (then meter-on)
- 1 Context Stack
- Telegram bridge included
- Full performance tracking (Phase 4)
- 90-day content history

**What's NOT in Growth:**
- Pipeline mode
- Multiple Context Stacks (one persona only)

### Scale — $X/month (TBD, draft: $199/mo)

**Who it's for:** Power users running content as core infrastructure. Multiple personas, high volume, full automation.

**Limits:**
- Unlimited platform connections
- Autopilot, approval, AND Pipeline mode (Phase 4)
- 500 generations per month
- AI cost cap: $150/month inclusive (then meter-on)
- Up to 5 Context Stacks (multi-persona / multi-brand)
- Telegram bridge with priority delivery
- Performance tracking with engine-learning bias (Phase 4)
- Unlimited content history
- Priority support

**What's NOT in Scale:**
- Team / agency multi-user (different SKU when it ships, post-Phase-4)
- White-label (different SKU, post-Phase-4)
- API access (different SKU, deferred indefinitely unless demand is loud)

---

## Free trial

**Length:** 14 days, full Growth-tier access, no credit card required.

**Why no card up front:** Onboarding requires the bootstrap interview, which is a 15-minute investment. Asking for a card before the customer has even seen the value is a conversion-killer. Friction at the right moment (post-trial) is fine; friction at the wrong moment (pre-onboarding) is fatal.

**What happens at end of trial:**
- Day 12: Email reminder, soft prompt in app
- Day 14: Account moves to read-only Starter equivalent. Nothing deletes. Customer can still see their stack, their content history, their queued pieces (which stop posting).
- Day 14+: "Subscribe to continue" prompt at the top of every page. Stack export available.

A trial that doesn't convert isn't a failure — it's a marketing asset (the customer has their stack and a sense of how the product works, both of which they'll remember when they're ready).

---

## Annual pricing

20% discount for annual prepay. Standard SaaS practice.

Reduces churn (people don't cancel a tool they prepaid for) and reduces processing overhead.

---

## Overage / metering

When a customer hits their generation count or AI cost cap mid-month, two options:

**Option A — Hard cap:** New generations blocked until next billing cycle. UI shows "You've hit this month's limit. Upgrade or wait until [date]."

**Option B — Metered overage:** Each additional generation costs $X (metered). Customer can choose to enable overage in settings.

We default to **Option A (hard cap)**. Metered overage is opt-in. This keeps surprises minimal — customers don't get a $400 bill because they had a busy week.

---

## Cost control: the daily cap

Inside the monthly cap, there's a per-day cap that prevents runaway usage spikes (e.g., a buggy pipeline mode run that spawns 50 generations in an hour).

**Default daily caps by tier:**
- Starter: $1/day
- Growth: $3/day
- Scale: $8/day

These caps are visible in the customer's UI as a "today's spend" pill (matching the pattern from Irie Threads admin). Hitting the daily cap pauses generations until midnight customer-local-time.

The daily cap is configurable downward but not upward (customers can be more conservative, but not more aggressive than their tier allows). This protects us from catastrophic single-day spend events.

---

## Plan changes

**Upgrade:** Immediate. Prorated to the rest of the billing cycle. New limits apply right away.

**Downgrade:** Takes effect at next billing cycle. Customer keeps current-tier features until then. If they're using more than the new tier allows (e.g., 4 platforms but downgrading to Starter), they're prompted to disconnect platforms before the change applies.

**Cancel:** Takes effect at next billing cycle. Customer keeps full access through the end of the paid period. After cancellation, account moves to read-only with stack export available indefinitely.

---

## What a "generation" actually is

To avoid ambiguity:

**1 generation =** 1 click of "Generate" or "Repurpose" in the UI, regardless of how many platform pieces come out of it.

So pasting a newsletter and getting 12 pieces back = 1 generation. Generating a topic in 3 different formats simultaneously = 1 generation if done in one request.

This is the customer-friendly framing. Internally we also track AI cost, but the customer's quota is "how many times did I run the engine."

Pipeline mode complicates this: each scheduled pipeline run counts as 1 generation. So a Scale-tier customer with a 3-pieces-per-day pipeline burns ~90 generations/month just on pipeline (well within the 500 cap, but worth noting).

---

## Future SKUs (deferred, documented for clarity)

These exist on the product roadmap but are not committed:

**Team / Agency tier**
- Multi-user accounts
- Shared Context Stacks across teammates
- Per-user usage tracking
- Estimated pricing: $400-800/month
- **Trigger to build:** Repeated demand from agency customers who want to run IrieStack on behalf of their clients
- **Phase:** Post-Phase-4

**White-label / API tier**
- Custom domain
- Branded UI
- Programmatic access via API key
- **Trigger to build:** Probably never. Different product. Documented here so we know to say no when the request comes up.

**Free / Forever tier**
- Severely limited (1 platform, 5 generations/month, no autopilot)
- **Trigger to consider:** If freemium becomes the right go-to-market motion for our audience. Lean against it for now — solo operators tend to convert better from trial than from forever-free.

---

## Pricing review cadence

Pricing should be revisited at fixed intervals, not in panic. The cadence:

- **Phase 1 → Phase 2 launch:** Initial pricing set based on cost projections.
- **3 months post-Phase 2:** First pricing review based on actual customer behavior. Adjust if cost-to-serve is materially different from projections.
- **Phase 3 launch:** Public pricing locked in for marketing site. Don't change again for 6 months.
- **Annually thereafter:** Review pricing once a year, in conjunction with major roadmap milestones.

Customers grandfather in at their current prices when increases happen. New customers pay new prices. This is standard SaaS practice and reduces the friction of price changes considerably.

---

## What this document doesn't cover

- **Promotional pricing / discount codes** — handled in Stripe at runtime.
- **Customer-specific deals** (one-off enterprise, etc.) — handle case-by-case via Stripe custom plans, not in the public pricing structure.
- **Refund policy** — see legal docs (separate from pricing structure).
- **Tax handling** — Stripe Tax handles this automatically, no decisions needed at the structural level.
