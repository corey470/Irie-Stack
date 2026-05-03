# DESIGN.md — IrieStack

```
Design system:    Irie Ecosystem Design Standard (per-product application)
Version:          2026-05
Canonical source: paperclip-irie-config/DESIGN.md (external; replicated here for repo self-containment)
Scope:            IrieStack — content automation SaaS. Two surfaces:
                  1. Marketing — public landing page (warm cream editorial)
                  2. Workspace — authenticated app (chat onboarding, generation
                     review, approval queue, context stack management)
                  No override of canonical brand gold. Stack uses the universal
                  accent (#C9A84C) without product-specific replacement.
```

> **Read this file before writing a single line of frontend UI code** — any HTML, CSS, JSX, Tailwind, or visual code. If a token is not defined in this file, **stop and surface the gap** rather than guess. PSYCHOLOGY.md is its required companion — read both.

---

## Brand Principle

**"It just needs to be Irie."** Total peace. Everything handled. No chaos. Calm and in order from the first moment.

For IrieStack specifically, this maps to: **"Your voice, on your terms, scaled."** The user trains the system once, then the system speaks for them — quietly, consistently, never sounding like an LLM. If the UI ever feels generative, slick, or "AI-assistant-y," it has failed the brand.

## Product Truths (non-negotiable)

1. **Familiar first.** Use shapes, gestures, and patterns users already know. The dashboard reads like a writer's editor or an editorial CMS — not like a generative AI app.
2. **Powerful underneath.** Intelligence belongs in the system, not in the chrome. No purple-blue gradients, no "✨ AI" badges, no glow-everywhere starfield motifs.
3. **The artifact dominates.** Generated posts, the Context Stack, and the bootstrap interview are *the artifact*. Tooling supports the artifact — never competes with it.
4. **Navigation is obvious.** A user knows where they are and how to get back within seconds. No mystery menus. No icon-only navs without labels above tablet width.
5. **Every visible control affects output.** No fake controls, no decorative toggles. If a switch doesn't change something the user can see, remove it.
6. **One primary CTA per viewport.** Decision paralysis is a conversion killer. Approve / Reject / Edit on a generated post counts as one decision, not three competing CTAs.
7. **No "AI look."** Stack is the most likely product in the family to be mistaken for generic LLM chrome. Resist hardest. Editorial and operational — never starry, never glowing.
8. **No fake systems.** No fake urgency, no fake activity ("AI is thinking..."), no decorative spinners. Honest progress states only.

---

## 1. Visual Theme & Atmosphere

IrieStack lives in two surfaces:

- **Marketing** — warm cream editorial. Landing page at the marketing domain. Large fluid display type, motion-forward, editorial pacing. The public face of the product.
- **Workspace** — warm cream canvas, tonal-stack elevation, calm motion. The authenticated app at `/app/*`: bootstrap chat, dashboard, generation review queue, approval queue, context stack viewer/editor, settings.

Both surfaces share one canvas philosophy: **warm, off-pure backgrounds — never `#FFFFFF`, never `#000000`**. The cream canvas does the work of absorbing visual noise so the generated content (the artifact) gets to breathe.

A single accent color — **brand gold `#C9A84C`** — carries every emphasis moment. State semantics (success/warning/destructive/info) live in their own functional-only palette and never compete with the brand accent.

**Universal characteristics:**
- Warm, off-pure canvases — never `#FFFFFF`, never `#000000`
- Single brand accent (gold `#C9A84C`) — used for primary CTAs, focus rings, active nav, logo mark, editorial rules
- Serif + sans pairing — serif for feeling, sans for function
- Maximum 3 font weights per page
- No decorative gradients
- Tonal elevation and subtle gold glow over heavy black drop shadows
- Motion respects `prefers-reduced-motion` — every animation must degrade

---

## 2. Color Palette & Roles

### 2.1 Brand Accent (Universal — Do Not Override)

| Token | Hex | Use |
|---|---|---|
| **Brand Gold** | `#C9A84C` | Default accent. Primary CTAs, focus rings, active nav, logo mark, editorial rules. |
| **Brand Gold Light** | `#E8C96A` | Hover state, brighter accent on dark surfaces. |
| **Brand Gold Deep** | `#A68838` | Accent on light surfaces where AA contrast against cream is required (small text links). |
| **Gold Glow Inner** | `rgba(201, 168, 76, 0.45)` | Inner ring of pulse/bloom shadow on hero CTA. |
| **Gold Glow Outer** | `rgba(201, 168, 76, 0.15)` | Outer halo of pulse/bloom shadow. |
| **Gold Hairline** | `rgba(201, 168, 76, 0.18)` | Subtle gold border treatment on accent surfaces. |
| **Gold Dim** | `rgba(201, 168, 76, 0.12)` | Subtle gold-tinted backgrounds for elevated accent panels. |

### 2.2 Canvas — Workspace (App)

- **BG Primary** (`#f0ebe2`): Default app canvas. Warm cream. Never pure white.
- **BG Surface** (`#FFFFFF`): Cards, modals, inputs — elevated one step above canvas.
- **BG Elevated** (`#f7f4ef`): Secondary panels, inline info blocks, generated-post preview frames.
- **BG Hover** (`#ede8df`): Hover state on cards and list items.
- **BG Active** (`#E5E0D8`): Pressed/active state on list rows.
- **BG Sidebar** (`#faf7f2`): Sidebar nav background — warmer than canvas.

### 2.3 Canvas — Marketing (Landing)

- **Marketing canvas**: `#FAF7F2` warm cream — same family, slightly brighter than workspace canvas.
- **Marketing surface deeper**: `#F1ECE2` for alternating sections.
- **Marketing card surface**: `#FFFFFF`.

### 2.4 Text Tiers

- **Text Primary** (`#1A1A1A`): Headings, primary data, H1-H3. Near-black, never pure `#000`.
- **Text Secondary** (`#5b5a55`): Descriptions, meta labels, helper copy.
- **Text Muted** (`#8C8C8C`): Placeholder, disabled, timestamps.
- **Text Faint** (`#C9C2B4`): Decorative text, section dividers with label.

### 2.5 State Palette (Functional Only — Do Not Use Decoratively)

- **Success** (`#22c55e`): Approved/published states. Green is reserved for "this post is live." Hover: `#16a34a`.
- **Warning** (`#d97706`): Pending review, items needing attention.
- **Destructive** (`#dc2626`): Reject, delete, disconnect platform.
- **Info** (`#2563eb`): Informational tooltips only. Use sparingly — gold carries emphasis.

> Note: Suite uses green as primary action color (a documented per-product override). **IrieStack does NOT override** — green stays state-only here. Primary CTAs are gold.

### 2.6 Border Tiers

- **Border DEFAULT** (`#E5E0D8`): Standard card/table borders, warm-tinted.
- **Border Subtle** (`#F1ECE2`): Inline dividers within cards.
- **Border Hover** (`#D6CEC2`): Hover state border darken.
- **Border Strong** (`#A68838`): Focus / selected emphasis (gold-deep).

---

## 3. Typography Rules

### Font Family

- **Display**: `DM Serif Display` (weight 400) via `next/font/google` — hero headlines, large numerics, editorial moments. Use class `font-display`.
- **Body**: `Inter` via CSS var `--font-inter`, with system-ui fallback — all UI copy, forms, tables, dashboards, generated-post-preview body.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
|------|------|------|--------|-------------|-------|
| Hero Display | DM Serif Display | clamp(2.5rem, 6vw, 5rem) | 400 | 1.1 | Marketing hero only |
| Page Title | DM Serif Display | 36px | 400 | 1.15 | Dashboard page H1 |
| Section Heading | Inter | 24px | 600 | 1.25 | In-app section headers |
| Card Title | Inter | 18px | 600 | 1.3 | Card headings, modal titles |
| Body | Inter | 15-16px | 400 | 1.55 | Default reading text |
| Body Small | Inter | 14px | 400 | 1.5 | Secondary copy, help text |
| Label | Inter | 13px | 500 | 1.4 | Form labels, table headers |
| Meta | Inter | 12px | 400 | 1.4 | Timestamps, counts, platform tags |
| Numeric Display | DM Serif Display | 48-64px | 400 | 1 | Dashboard metric numbers |
| Button | Inter | 14-15px | 500 | 1 | All button text |
| Generated Post Body | Inter | 15px | 400 | 1.6 | Preview of LinkedIn/X/etc. post — generous leading |

### Principles

- **Serif for feeling, numerics, and hero moments.** DM Serif Display appears on landing pages and on large dashboard numerics only.
- **Inter for every working surface.** Generated-post previews use Inter even though some platforms render in their own fonts — we're showing the *content*, not simulating the platform skin.
- **Restrained weight scale.** Inter at 400 (body), 500 (labels/buttons), 600 (headings). Avoid 700+ — calm interface, not shouty.
- **Generous line-height on body (1.5–1.6).** Users read generated posts carefully before approving. Never tighter than 1.5 on body.
- **Maximum 3 font weights per page.**

---

## 4. Component Stylings

### Buttons

**Primary (Gold CTA)**
- Background: `#C9A84C`
- Text: `#1A1A1A` (gold needs near-black text for AA contrast)
- Padding: `px-4 py-2` (default) / `px-6 py-3` (hero)
- Radius: `rounded-md` (6px)
- Font: Inter 14-15px weight 500
- Hover: background shifts to `#E8C96A`
- Focus: `2px solid #A68838` ring, 2px offset, 4px radius on the ring itself
- Pulse (hero only): `cta-pulse` animation, 2.8s gold glow ring (`Gold Glow Inner` → `Gold Glow Outer`)
- Use: Single primary action per view — "Generate Posts," "Approve & Schedule," "Continue Onboarding," "Save Stack"

**Secondary (Outline)**
- Background: transparent
- Text: `#1A1A1A`
- Border: `1px solid #E5E0D8`
- Hover: `bg-bg-hover` (`#ede8df`), border to `#D6CEC2`
- Use: Reject, Cancel, "Edit Voice" — alternate actions

**Ghost**
- Background: transparent
- Text: `#5b5a55`
- No border
- Hover: `bg-bg-hover`
- Use: Toolbar icons, inline actions, menu triggers, per-platform mode toggles

**Destructive**
- Background: transparent
- Text: red-600 (`#dc2626`)
- Border: usually none; `1px solid #fecaca` on confirmation
- Hover: `bg-red-50`
- Use: Disconnect platform, Delete stack, Cancel subscription — rare destructive actions

**Approve / Reject Pair (Generation Review)**
- Approve: gold primary CTA above + Reject ghost (`text-red-600`) below — never side-by-side, never equal weight. Approval is the path.

### Cards & Containers

**Standard Card**
- Background: `#FFFFFF`
- Border: none — defined by shadow instead
- Radius: `rounded-lg` (8px)
- Shadow: `0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)` — the "flat-plus-ring" pattern
- Hover: `0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)`
- Padding: `p-4` to `p-6`

**Generated-Post Preview Card**
- Same card base
- Per-platform header chip (LinkedIn / X / Threads / etc.) in Inter 12px weight 500 with platform color hairline
- Post body in Inter 15px line-height 1.6
- Char count and platform-specific limits shown in `Text Muted` 12px below post
- Approve/Reject/Edit footer row separated by `Border Subtle` divider

**Context Stack Card**
- Same card base
- Section icon (16px gold) + section title (Inter 14px weight 600)
- Section body in Inter 14px line-height 1.5 — this is the *user's own voice captured during onboarding*. Treat it editorially, not as form data.
- Edit button as Ghost in top-right

**Metric Card (Dashboard)**
- Same card base
- Metric number in DM Serif Display 48px weight 400 — `Text Primary`
- Label above: Inter 13px weight 500 uppercase tracking-wide `Text Secondary`
- Sparkline / delta below in Inter 12px (`#22c55e` up / `#dc2626` down)

### Navigation

**Sidebar (App Shell)**
- Background: `#faf7f2`
- Width: 248px expanded, 68px collapsed (animated transition)
- Border-right: `1px 0 0 0 rgba(0,0,0,0.08)` (via shadow, not border)
- Nav item: Inter 14px weight 400 `Text Secondary`, active gets `Text Primary` + gold icon + subtle `bg-bg-hover`
- Icon: 20px, stroke 1.5, matches text color except when active (gold)

**Topbar**
- Background: `#FFFFFF`
- Border-bottom: `0 1px 0 0 rgba(0,0,0,0.08)` (shadow)
- Height: 56-64px
- Contains: workspace switcher (if multiple stacks), notifications, account menu

**Dropdowns / Menus**
- Background: `#FFFFFF`
- Radius: `rounded-md` (6px)
- Shadow: `0 8px 24px -4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)`
- Item padding: `px-3 py-2`, hover `bg-bg-hover`

### Forms

**Input**
- Background: `#FFFFFF`
- Border: `1px solid #E5E0D8`
- Radius: `rounded-md` (6px)
- Padding: `px-3 py-2`
- Font: Inter 15px weight 400
- Focus: border `#C9A84C`, ring `2px solid #A68838` with 2px offset
- Label above in Inter 13px weight 500 `Text Primary`

**Chat Input (Bootstrap Onboarding)**
- Same input base, but full-width and elevated above an `bg-elevated` rail at the bottom of the chat surface
- Auto-grow textarea up to 6 rows
- Send button: gold icon button (paper-plane or arrow) — Inter 14px paired with Cmd+Enter helper

### Distinctive Components

**Platform Chip** (Generated Post header)
- `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium`
- Background: `#FFFFFF` with `1px solid` of the platform's brand hairline
- Inline SVG platform icon at 12px (NEVER lucide brand icons — see §11)
- Use: above each generated post preview to mark which channel it's for

**Mode Toggle (Approval / Autopilot)**
- Per-channel switch with two states: "Review" (default) / "Autopilot"
- Track: `#E5E0D8` off → gold (`#C9A84C`) on
- Thumb: `#FFFFFF` with `0 1px 2px rgba(0,0,0,0.2)`
- Label below: "Posts wait for your approval" / "Posts go live automatically"
- Use: per-channel in Settings or inline above generation review queue

**Stack Section Marker**
- Small gold dot (`6px` `#C9A84C`) preceding section labels in the Context Stack viewer
- Signals "this is part of your trained voice"

**Hero Reveal (Marketing)**
- `reveal-section` class: `opacity 0 → 1` + `translateY(28px → 0)` over 0.6s `cubic-bezier(0.16, 1, 0.3, 1)`
- `reveal-stagger` children: nth-child delays (0, 90, 180, 270ms)
- `hero-zoom-in`: 1.4s scale(1.05 → 1) on hero images

---

## 5. Layout Principles

### Spacing System
- Base unit: 4px (Tailwind)
- Common scale: 4, 8, 12, 16, 20, 24, 32, 48, 64px
- Section padding: `py-12` to `py-20` (marketing), `py-6` to `py-8` (app)
- Card padding: `p-4` compact, `p-6` standard, `p-8` feature

### Grid & Container
- App shell: 248px sidebar + flex main with `max-w-7xl` centered inside
- Marketing: `max-w-7xl` centered, `px-6` mobile, `px-8` desktop
- Generation review queue: 2-column on desktop (post preview left, edit/approve panel right) → stacked on mobile
- Dashboard grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for metric cards

### Whitespace Philosophy
- **Warm density**: app views pack information but never feel tight because the cream canvas absorbs visual noise.
- **The artifact breathes**: generated post previews always have at least `p-6` and `gap-4` between posts in a list — never crammed.
- **Hero breathes**: marketing sections lean into 80-120px vertical padding; app views tighten to 24-48px.

### Border Radius Scale
- Micro (4px): Small badges, status pills, platform chips
- Standard (6px): Buttons, inputs, dropdowns
- Card (8px): `rounded-lg` — most cards, modals, panels, post previews
- Feature (12px): Hero cards, onboarding modals
- Full: Avatars, chips, status pills

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (L0) | No shadow, canvas bg | Default sections, text blocks |
| Card (L1) | `0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)` | Standard cards, post previews, panels |
| Card Hover (L2) | `0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)` | Hover/active on cards |
| Topbar (L2.5) | `0 1px 0 0 rgba(0,0,0,0.08)` | Sticky topbar bottom edge |
| Sidebar (L2.5) | `1px 0 0 0 rgba(0,0,0,0.08)` | Sidebar right edge |
| Dropdown (L3) | `0 8px 24px -4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)` | Menus, popovers, autocomplete |
| Modal (L4) | `0 20px 48px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)` | Dialogs, confirmation modals |
| CTA Pulse | `cta-pulse` animation, 2.8s gold glow | Hero primary CTA only |

**Shadow Philosophy**: Every card shadow pairs a soft diffuse blur with a 1px hairline ring — the "flat-plus-ring" pattern. This gives elevation without softening the edge. Elevation also emerges from the tonal stack so shadows stay subtle.

---

## 7. Do's and Don'ts

### Do
- Use the warm cream (`#f0ebe2`) workspace canvas — never pure white as page background
- Pair DM Serif Display (hero, numerics) with Inter (everything else)
- Reserve gold `#C9A84C` for primary actions, focus, active nav — must mean emphasis
- Apply card shadows as "flat-plus-ring" — diffuse blur + 1px inner hairline
- Keep motion slow: 0.6s reveal with `cubic-bezier(0.16, 1, 0.3, 1)` long-decay curve
- Render focus rings in `#A68838` with 2px offset — accessibility is non-negotiable
- Use the 248/68px sidebar pattern for app layout
- Treat generated post bodies like editorial content — generous leading, calm chrome around them
- Show platform chips with inline-SVG brand icons (never lucide brand icons — see §11)

### Don't
- Don't use pure white backgrounds for page canvas — sterile
- Don't use any decorative purple/blue gradients, glow effects, or "AI" iconography — Stack must NOT look like a generic LLM app
- Don't use font weight 700+ on UI — shouty, breaks calm tone
- Don't tighten body line-height below 1.5
- Don't use heavy drop shadows — elevation is tonal + hairline ring
- Don't put more than one primary (gold) CTA on screen at a time
- Don't show fake "AI is thinking..." spinners with anthropomorphized language. Use plain progress states ("Generating posts...") with honest indeterminate or determinate progress.
- Don't simulate platform UIs (LinkedIn frame, X bird outline) in post previews — show the content cleanly with a small platform chip header instead
- Don't use lucide-react brand icons for FB/Twitter/IG/GitHub/LinkedIn/YouTube — see §11

---

## 8. Responsive Behavior

### Breakpoints (Tailwind defaults)
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Sidebar becomes drawer, 1-col post review, 1-col metrics |
| sm | 640-768px | 2-col grids, sidebar still drawer |
| md | 768-1024px | Sidebar collapses to 68px icon-only; generation review goes 2-col |
| lg | 1024-1280px | Full 248px sidebar, 3-col dashboards |
| xl | ≥1280px | Max content width, generous gutters |

### Touch Targets
- Buttons: min 40-44px height (`py-2` on small, `py-3` on default)
- Sidebar nav items on mobile: 48px height
- Inputs: 40px min height on touch
- Approve / Reject buttons in generation review: full-width on mobile, stacked vertically with primary on top

### Collapsing Strategy
- Hero: `clamp(2.5rem, 6vw, 5rem)` — fluid scaling, no abrupt jumps
- Sidebar: 248px → 68px → drawer overlay
- Generation review queue: 2-col (preview + actions) → stacked (preview, then actions below)
- Mode toggle: side-by-side label+switch → stacked label-above-switch on mobile
- Reduced motion: all reveals, hero zoom, CTA pulse disabled

---

## 9. Mobile First Rules

Mobile is where real users review generated posts (commuting, between meetings, during downtime). Every page, every flow, every component is designed at 375px first and scales up.

### Hard Rules
- **Design viewport starts at 375px.** Every component must look correct and be usable at 375px wide.
- **Touch targets minimum 44px.** All interactive elements — buttons, nav links, form controls, icon buttons. Pad small icon buttons with a transparent hit area if visual size must stay smaller.
- **No horizontal scroll, ever.** Pages fit within viewport width at every breakpoint.
- **Full-width inputs and buttons on mobile.** Form fields and primary CTAs span the available content width.
- **Fluid typography via `clamp()`.** All hero and section headlines use `clamp(min, vw, max)`. Minimum body size is 16px on mobile (prevents iOS input zoom on focus).
- **Content never touches screen edges.** Minimum 16px (1rem) horizontal padding on every scrollable section.
- **Thumb-zone awareness.** Approve / Reject buttons in the review queue live in the bottom third of the screen. Sticky-bottom action bars are acceptable for the review flow.
- **Modals go full-screen on mobile.** Dialogs smaller than the viewport are hard to tap.
- **Critical flows end-to-end on mobile.** Bootstrap chat onboarding, generation review queue, approve-and-publish must all work flawlessly at 375px with no blocked interactions or clipped controls.

### IrieStack-Specific Mobile Priority
- **Generation review queue is the daily mobile use case.** A user opens the app on their phone, scrolls a stack of generated posts, taps Approve or Edit, and moves on. This flow must be effortless one-thumb.
- **Bootstrap chat must work on mobile.** New users may sign up from a phone. The chat onboarding should feel like a familiar messaging interface — full-screen chat, sticky input at bottom, no awkward modals.

---

## 10. Motion

- **Page transitions**: 200–300ms
- **Card hover state**: 150ms
- **Scroll reveals (marketing)**: 0.6s `cubic-bezier(0.16, 1, 0.3, 1)`
- **Hero zoom-in (marketing)**: 1.4s scale(1.05 → 1)
- **CTA pulse (hero only)**: 2.8s gold glow loop
- **Approval feedback**: brief 200ms fade + checkmark on approved post; no confetti, no celebration animation
- **Generation in-progress**: indeterminate progress bar in gold (subtle), or per-platform spinner with platform name label — NEVER an anthropomorphized "AI is thinking" message
- **Reduced motion**: all reveals, hero zoom, CTA pulse disabled. Functional transitions remain.

If removing the animation changes nothing about the message, remove the animation.

---

## 11. Brand Icons — Inline SVG Only

**Never use lucide-react brand icons** for Facebook, Twitter/X, Instagram, GitHub, LinkedIn, YouTube, Threads, TikTok, or any social platform. Lucide's brand glyphs are stylized approximations and break brand-visual recognition.

**Required pattern**: inline `<svg>` with the platform's official mark, sized 12-20px, color matched to the platform's brand or set to `currentColor` for monochrome contexts. Source from each platform's official brand guidelines.

Lucide is fine for non-brand icons (chevrons, gears, plus, etc.).

---

## 12. Accessibility

- **WCAG AA contrast** is the floor. Body text on cream canvas: `#1A1A1A` on `#f0ebe2` = 14.4:1 (AAA). Gold CTA: `#1A1A1A` on `#C9A84C` = 7.8:1 (AAA). Text on gold = ALWAYS dark, never white — gold + white = 1.9:1 (fails AA). 
- **Focus rings on every interactive element.** `2px solid #A68838` with 2px offset, 4px radius on the ring itself. Never `outline: none` without a visible replacement.
- **Keyboard navigation**: tab order matches visual order. Approve / Reject in review queue both reachable. Modal focus traps in.
- **`aria-live="polite"`** on generation status announcements ("3 posts ready for review").
- **Alt text** on every image. Generated images (Phase 4+) get descriptive alt text from the generation prompt.
- **Form labels** are always visible — never placeholder-only labels. Placeholders are examples, not labels.
- **Reduced motion**: see §10.

---

## 13. Agent Prompt Quick Reference

### Color Cheat Sheet
- App canvas: `#f0ebe2` (warm cream)
- Surface: `#FFFFFF`
- Sidebar: `#faf7f2`
- Text primary: `#1A1A1A`
- Text secondary: `#5b5a55`
- Text muted: `#8C8C8C`
- Accent gold: `#C9A84C` (hover `#E8C96A`, focus `#A68838`)
- Border default: `#E5E0D8`
- Card shadow: `0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)`

### Component Prompt Examples
- **Marketing hero**: "IrieStack landing hero. Canvas `#FAF7F2`. DM Serif Display headline `clamp(2.5rem, 6vw, 5rem)` weight 400 line-height 1.1 `#1A1A1A`. Subhead Inter 18px weight 400 `#5b5a55`. Primary CTA gold `#C9A84C` background, `#1A1A1A` text, `rounded-md px-6 py-3`, `cta-pulse` animation."
- **Generated post preview card**: "Card bg `#FFFFFF`, `rounded-lg`, shadow flat-plus-ring, `p-6`. Top row: platform chip with inline SVG icon at 12px + Inter 12px weight 500 platform name. Body: Inter 15px line-height 1.6 `#1A1A1A`. Footer: char count Inter 12px `#8C8C8C` left, Approve gold CTA + Reject ghost right."
- **Context stack section**: "Card bg `#FFFFFF`, `rounded-lg`, shadow flat-plus-ring, `p-6`. Header: gold dot 6px + Inter 14px weight 600 section title. Body: Inter 14px line-height 1.5 `#1A1A1A`. Edit button as Ghost top-right."
- **Mode toggle**: "Per-channel toggle. Track 32×18px `#E5E0D8` off → `#C9A84C` on. Thumb 14px `#FFFFFF` with `0 1px 2px rgba(0,0,0,0.2)`. Label Inter 13px below: 'Posts wait for your approval' / 'Posts go live automatically'."
- **Bootstrap chat input**: "Sticky bottom input on chat surface. Auto-grow textarea up to 6 rows, `bg-white`, `rounded-md`, `border border-#E5E0D8`, focus `border-#C9A84C ring-2 ring-#A68838`. Inter 15px. Send button: gold icon button with paper-plane SVG, Cmd+Enter helper text below."

### Iteration Guide
1. Warm cream (`#f0ebe2`) canvas — never pure white
2. Gold `#C9A84C` = primary action + emphasis. Never decorative.
3. DM Serif Display for hero + numerics; Inter for every working UI surface
4. Shadows = "flat-plus-ring" (soft blur + 1px inner hairline)
5. Tonal elevation: canvas → surface → elevated → hover
6. Motion is slow and long-decay (0.6s `cubic-bezier(0.16, 1, 0.3, 1)`)
7. Focus ring is `#A68838` 2px with 2px offset — non-negotiable
8. Sidebar is 248px / 68px collapsed / drawer on mobile
9. One primary CTA per view — gold pulses only in hero moments
10. **No AI-look:** no purple-blue gradients, no glow, no starfield, no "✨ AI" badges
11. Generated posts are editorial content — give them room
12. Inline SVG for brand icons — never lucide brand glyphs
