# Phase 1 Slice 1 — Claude Code Prompt

Drafted 2026-05-03. Paste the code block below into a fresh Claude Code session in `/Users/irieagent/Documents/Irie_Stack/`.

Definition of done: a Vercel preview URL where you can land on a marketing page, sign up via magic link or Google, and reach an empty `/app` placeholder. You walk that preview URL before any merge to main.

---

```
You are picking up IrieStack, Phase 1 Slice 1. The repo is /Users/irieagent/Documents/Irie_Stack/ on a fresh machine with no scaffold yet. The 14-doc product spec, DESIGN.md, and PSYCHOLOGY.md are already on `main`. Read FOLDER-MAP.md, README.md, ARCHITECTURE.md, ROADMAP.md ("What I'd build first, concretely"), DESIGN.md, and PSYCHOLOGY.md before writing code.

INFRA ALREADY PROVISIONED — DO NOT RECREATE
- GitHub: corey470/Irie-Stack (origin already set on local repo)
- Supabase project: name `irie-stack`, id `khrbrndygemlcxinetoh`, region us-east-1, URL https://khrbrndygemlcxinetoh.supabase.co
- Vercel project: name `irie-stack`, id `prj_QtFcyY3FCPD0FZD5Gp9FNJ37BTx5`, team `team_BUfbPxIbyANfrNIYoWhuMg9Z`, framework nextjs, region iad1, linked to corey470/Irie-Stack
- Vercel env vars already wired (Production + Preview): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (sensitive). Mirror these into a local `.env.local` for dev — fetch values via `vercel env pull` if needed (CLI is logged in as corey-1860).
- Git identity is already set globally (coreystewardtraining@gmail.com / Corey Steward). Verify before first commit; do NOT alter.

WORKFLOW RULES — MANDATORY
- Preview-branch-first. Create a branch `phase-1-slice-1`. Open a PR. Walk the live preview URL before any merge to main. Do NOT merge to main in this slice.
- DESIGN.md + PSYCHOLOGY.md are the source of truth for any UI. If a token or pattern isn't defined, surface the gap rather than guess.
- Mobile-first audit on every UI piece: clamp() typography, 44px touch targets, no horizontal scroll at 375px, full-width inputs/CTAs on mobile.
- Brand icons (FB, Twitter/X, Instagram, GitHub, LinkedIn, YouTube) are inline SVG only. Never lucide-react brand glyphs.
- No "AI look" — no purple/blue gradients, no glow-everywhere, no starfield, no "✨ AI" badges, no anthropomorphized loading states. IrieStack is editorial, not generative-LLM-chic.

SCOPE — Phase 1 Slice 1

1. Next.js 15 scaffold
   - App Router, TypeScript, Tailwind CSS, ESLint
   - `next/font` for Inter (body) and DM Serif Display (display) per DESIGN.md
   - Tailwind config with the IrieStack design tokens from DESIGN.md §2 (canvas, surfaces, gold accent, text tiers, borders, shadows). Expose them as semantic Tailwind colors (`bg-bg-primary`, `bg-bg-surface`, `text-text-primary`, `accent`, etc.) so future components don't hardcode hex values.
   - `prefers-reduced-motion` honored globally — define a CSS media block that disables `cta-pulse`, `reveal-section`, `hero-zoom-in`.

2. Supabase wiring
   - Install `@supabase/supabase-js` and `@supabase/ssr`
   - Server client + browser client + middleware refresh — current best-practice pattern for App Router
   - Local `.env.local` populated from Vercel (do not commit)

3. Schema + RLS — apply via a Supabase migration file in `supabase/migrations/` so it's repeatable
   - `users` (managed by Supabase Auth — no custom table needed unless we need profile fields; if we add a `profiles` table referencing `auth.users(id)`, document why)
   - `context_stacks` — at minimum: `id uuid pk default gen_random_uuid()`, `user_id uuid references auth.users(id) on delete cascade`, `name text not null`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`. RLS: a user can SELECT/INSERT/UPDATE/DELETE only their own rows.
   - `jobs` — `id uuid pk`, `user_id uuid references auth.users(id) on delete cascade`, `stack_id uuid references context_stacks(id) on delete cascade`, `status text not null default 'pending' check (status in ('pending','running','completed','failed'))`, `payload jsonb`, `created_at`, `updated_at`. RLS: same per-user policy.
   - All three tables: enable RLS. Write the policies explicitly. Add updated_at triggers.

4. Auth flows
   - Magic link sign-in (Supabase Auth default)
   - Google OAuth — code path wired and documented; FLAG that the user must create the Google Cloud OAuth client and paste credentials into Supabase Auth → Providers → Google before it actually works. Do NOT block on this; ship the UI behind a feature flag or as the second button that links through Supabase's OAuth start URL.
   - Sign-out
   - Session refresh middleware on protected routes

5. Marketing landing page (`/`)
   - Single page, public (no auth)
   - Hero (headline + subhead + primary gold CTA "Start My Stack")
   - 3-section explainer (Train it once / Generate the week / Approve or autopilot — copy per PSYCHOLOGY.md voice rules)
   - Waitlist signup form — email input + submit button. Submits to a `waitlist` table (add to migration: `id uuid pk`, `email text unique not null`, `created_at`). Public INSERT policy on the email column only; no SELECT for anonymous users.
   - Mobile-first: clamp() hero, full-width CTA, 16px min body, 44px touch targets.
   - Reveal animation on scroll for the 3 explainer sections per DESIGN.md §10.
   - Honest progress + error states on the waitlist form. Success state stays inline (no toast library).

6. App shell (`/app`)
   - Behind auth — middleware redirects unauthenticated users to `/login`
   - 248/68/drawer sidebar shell per DESIGN.md §4 — items are placeholders ("Stack", "Generate", "Review", "Settings") with `disabled` state since nothing is wired yet
   - Empty state on `/app`: "Welcome — your stack is empty. Let's build it." with a single gold CTA "Start onboarding" that goes to `/onboarding` placeholder route (page that just says "Bootstrap chat coming next slice").
   - No real functionality wired in this slice — the shell exists so the next slice has somewhere to land.

7. Login page (`/login`)
   - Email magic-link form + "Continue with Google" button
   - Clean, calm, single primary CTA per DESIGN/PSYCHOLOGY rules
   - Friendly empty-state-style "Check your email" confirmation after magic link request
   - Mobile-first

8. Telemetry / errors
   - Console-only logging this slice. No Sentry, no PostHog, no analytics — wire those in a later slice.
   - Server actions and API routes log structured errors on failure.

9. Documentation
   - Update README.md if any non-spec'd setup steps emerge (Google OAuth steps, env var list, dev workflow)
   - Add a brief `CONTRIBUTING.md` if needed — keep it short

SPECIALIST ROSTER (FIX-ON-FIND for safe in-scope; risky findings flagged at bottom of your final report)
- Backend Architect — Supabase schema, RLS policies, migration structure, server-side auth wiring, env var hygiene
- Frontend Developer — Next.js 15 App Router scaffold, Tailwind config, layout primitives, route group organization, middleware
- Senior Developer — premium implementation glue, especially the auth flow and the design-token Tailwind setup
- UI Designer — apply DESIGN.md tokens correctly to landing + login + app shell; verify spacing, typography, shadow patterns; one primary CTA per viewport
- Accessibility Auditor — focus rings on every interactive (`#A68838` 2px with 2px offset), AA contrast on all text/CTA pairs, keyboard tab order, ARIA on the waitlist + login forms, reduced-motion fallbacks, alt text on any images
- Whimsy Injector — micro-moments of warmth in copy and inline states (NO confetti, NO ✨, NO anthropomorphized loading messages — see PSYCHOLOGY.md §4)

FIX-ON-FIND POLICY (apply silently)
- Token / token-hex hardcodes that should reference Tailwind semantic colors → fix
- Missing focus rings on interactive elements → fix
- Missing alt text → fix
- Mobile-breakage at 375px → fix
- Lucide brand glyphs anywhere → replace with inline SVG
- Body line-height < 1.5 on body copy → fix
- Pure-white or pure-black backgrounds anywhere → fix to design-system canvas
- Missing reduced-motion fallback for any new animation → add it

RISKY FINDINGS — FLAG, DO NOT FIX (write at bottom of final report)
- Anything that requires changing a `main`-locked decision (auth provider, framework version, hosting, AI vendor, queue choice)
- Anything that needs Corey to perform an external action (Google Cloud Console setup, custom domain DNS, paid-plan upgrades)
- Schema changes that affect existing rows (we have none yet, so unlikely this slice — but flag if any future-proofing tradeoff is non-obvious)
- UI patterns that don't have a clear DESIGN.md token (do not invent — surface the gap)
- Anything that triples the slice scope

DELIVERABLES
- Branch: `phase-1-slice-1` pushed to origin
- PR: opened against `main` with a clear summary, screenshot of the landing page on mobile + desktop, and a checklist of the scope items
- Vercel preview URL: included in the PR body, clearly labeled
- Final report at the bottom of the PR description: what shipped, what's flagged, mobile-first audit results (375px screenshot proof), accessibility audit summary, any risky findings

DO NOT
- Do NOT merge to main
- Do NOT add features beyond this slice (no bootstrap chat UI, no generation engine, no Stripe, no Telegram, no per-platform connectors — those are later slices)
- Do NOT use the Reality Checker mid-slice. Reality Checker runs ONCE at the end of a complete build before merge to production — not per slice.
- Do NOT alter git config or add co-authors that aren't Corey
- Do NOT add lucide brand icons; do NOT add purple/blue gradients; do NOT anthropomorphize loading states
```

---

## After this prompt finishes

1. Walk the preview URL on mobile (375px) and desktop. Submit the waitlist form. Try magic-link sign-in. Try Google OAuth (will fail until Google Cloud OAuth client is set up — that's expected, just verify the redirect attempt looks right).
2. If everything checks out, merge the PR.
3. Next prompt (Phase 1 Slice 2): bootstrap interview chat UI.
