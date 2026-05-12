"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "saving" | "error";
type AssistantStatus = "idle" | "thinking" | "error";
type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type InitialOnboarding = {
  name: string;
  voiceNotes: string;
  profile: Record<string, unknown>;
  links: unknown[];
  completedAt: string | null;
};

type FormState = {
  profileName: string;
  personOrBrand: string;
  whatYouDo: string;
  audience: string;
  offers: string;
  goals: string;
  platforms: string[];
  approvalPreference: string;
  postingRhythm: string;
  tone: string;
  phrases: string;
  avoid: string;
  stories: string;
  links: string[];
};

const PLATFORMS = [
  "X",
  "LinkedIn",
  "Facebook",
  "Instagram",
  "Threads",
  "TikTok",
  "Substack",
];

const APPROVAL_OPTIONS = [
  { value: "monthly", label: "Approve the whole month" },
  { value: "weekly", label: "Approve one week at a time" },
  { value: "daily", label: "Approve each day" },
  { value: "individual", label: "Approve every post" },
  { value: "autopilot", label: "Autopilot after creating" },
];

export function OnboardingClient({ initial }: { initial: InitialOnboarding }) {
  const router = useRouter();
  const parsed = useMemo(() => initialState(initial), [initial]);
  const [form, setForm] = useState<FormState>(parsed);
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Tell me what this content engine is for. You can talk normally. I’ll pull out your audience, offers, voice, platforms, and posting preferences.",
    },
  ]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus>("idle");
  const [readyScore, setReadyScore] = useState(0);

  const steps = [
    {
      label: "Identity",
      title: "Who is this content for?",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Profile name"
            value={form.profileName}
            onChange={(value) => update("profileName", value)}
            placeholder="Corey's Content Engine"
          />
          <Field
            label="Person, brand, or business"
            value={form.personOrBrand}
            onChange={(value) => update("personOrBrand", value)}
            placeholder="Corey Steward, Irie Threads, Irie Transportation..."
          />
          <TextArea
            label="What do you do?"
            value={form.whatYouDo}
            onChange={(value) => update("whatYouDo", value)}
            placeholder="Explain it like you would to a normal person."
          />
          <TextArea
            label="Who are you talking to?"
            value={form.audience}
            onChange={(value) => update("audience", value)}
            placeholder="Customers, creators, founders, local riders, shoppers..."
          />
        </div>
      ),
    },
    {
      label: "Links",
      title: "What should IrieStack know about you?",
      body: (
        <div className="space-y-4">
          <TextArea
            label="Offers, services, products, or ideas you talk about"
            value={form.offers}
            onChange={(value) => update("offers", value)}
            placeholder="The things your content should naturally point back to."
          />
          <TextArea
            label="What should social media do for you?"
            value={form.goals}
            onChange={(value) => update("goals", value)}
            placeholder="Book rides, sell apparel, build trust, explain the platform, stay visible..."
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Important links
            </label>
            <div className="space-y-2">
              {form.links.map((link, index) => (
                <input
                  key={index}
                  type="url"
                  value={link}
                  onChange={(event) => updateLink(index, event.target.value)}
                  placeholder="https://..."
                  className="h-12 w-full rounded-md border border-border bg-bg-surface px-4 text-[16px] text-text-primary shadow-card placeholder:text-text-muted focus:border-accent"
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Platforms",
      title: "Where should the system plan content?",
      body: (
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((platform) => (
              <label
                key={platform}
                className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-bg-surface px-3 text-sm text-text-primary shadow-card"
              >
                <input
                  type="checkbox"
                  checked={form.platforms.includes(platform)}
                  onChange={() => togglePlatform(platform)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                {platform}
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Approval style"
              value={form.approvalPreference}
              onChange={(value) => update("approvalPreference", value)}
              options={APPROVAL_OPTIONS}
            />
            <Field
              label="Posting rhythm"
              value={form.postingRhythm}
              onChange={(value) => update("postingRhythm", value)}
              placeholder="Example: weekdays at 9 AM and 3 PM"
            />
          </div>
        </div>
      ),
    },
    {
      label: "Voice",
      title: "How should the posts sound?",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea
            label="Tone"
            value={form.tone}
            onChange={(value) => update("tone", value)}
            placeholder="Direct, warm, practical, funny, spiritual, founder-led..."
          />
          <TextArea
            label="Words or phrases you actually use"
            value={form.phrases}
            onChange={(value) => update("phrases", value)}
            placeholder="off my plate, go cook, make it Irie..."
          />
          <TextArea
            label="What should it never sound like?"
            value={form.avoid}
            onChange={(value) => update("avoid", value)}
            placeholder="Corporate, fake guru, hype machine, too polished..."
          />
          <TextArea
            label="Stories or examples you like using"
            value={form.stories}
            onChange={(value) => update("stories", value)}
            placeholder="Customer moments, building in public, family/business lessons..."
          />
        </div>
      ),
    },
  ];

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  function updateLink(index: number, value: string) {
    setForm((current) => {
      const links = [...current.links];
      links[index] = value;
      return { ...current, links };
    });
    setStatus("idle");
  }

  function togglePlatform(platform: string) {
    setForm((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform],
    }));
  }

  function applyAssistantDraft(draft: Partial<FormState>) {
    setForm((current) => ({
      ...current,
      profileName: cleanDraftString(draft.profileName, current.profileName),
      personOrBrand: cleanDraftString(draft.personOrBrand, current.personOrBrand),
      whatYouDo: cleanDraftString(draft.whatYouDo, current.whatYouDo),
      audience: cleanDraftString(draft.audience, current.audience),
      offers: cleanDraftString(draft.offers, current.offers),
      goals: cleanDraftString(draft.goals, current.goals),
      platforms: Array.isArray(draft.platforms) && draft.platforms.length
        ? draft.platforms.filter((platform) => PLATFORMS.includes(platform))
        : current.platforms,
      approvalPreference: typeof draft.approvalPreference === "string"
        && APPROVAL_OPTIONS.some((option) => option.value === draft.approvalPreference)
        ? draft.approvalPreference
        : current.approvalPreference,
      postingRhythm: cleanDraftString(draft.postingRhythm, current.postingRhythm),
      tone: cleanDraftString(draft.tone, current.tone),
      phrases: cleanDraftString(draft.phrases, current.phrases),
      avoid: cleanDraftString(draft.avoid, current.avoid),
      stories: cleanDraftString(draft.stories, current.stories),
      links: Array.isArray(draft.links) && draft.links.length
        ? [...draft.links.filter(Boolean), "", "", "", "", ""].slice(0, 5)
        : current.links,
    }));
  }

  async function sendAssistantMessage(message = assistantInput) {
    const cleanMessage = message.trim();
    if (!cleanMessage || assistantStatus === "thinking") return;

    const nextMessages: AssistantMessage[] = [
      ...assistantMessages,
      { role: "user", content: cleanMessage },
    ];
    setAssistantMessages(nextMessages);
    setAssistantInput("");
    setAssistantStatus("thinking");
    setError(null);

    try {
      const res = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          draft: form,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not read that yet.");

      applyAssistantDraft(body.draft ?? {});
      if (typeof body.readyScore === "number") setReadyScore(body.readyScore);
      const reply = [body.reply, body.nextQuestion].filter(Boolean).join("\n\n");
      setAssistantMessages((current) => [
        ...current,
        { role: "assistant", content: reply || "Good. I added that to the profile." },
      ]);
      setAssistantStatus("idle");
    } catch (err) {
      setAssistantStatus("error");
      setError(err instanceof Error ? err.message : "Assistant could not read that.");
    }
  }

  async function save() {
    setStatus("saving");
    setError(null);

    try {
      const res = await fetch("/api/stack", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.profileName || "My Content Profile",
          voice_notes: compileVoiceNotes(form),
          profile: buildProfile(form),
          links: cleanLinks(form.links).map((url) => ({ url })),
          onboarding_completed_at: new Date().toISOString(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save onboarding.");

      router.push("/app/research");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not save onboarding.");
    }
  }

  const current = steps[activeStep];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-md border border-border bg-bg-surface shadow-card">
        <div className="border-b border-border-subtle p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">
            Setup assistant
          </p>
          <h2 className="mt-1 text-xl font-semibold text-text-primary">
            Talk it out first.
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            The assistant fills the profile. You can review or edit anything on
            the right.
          </p>
        </div>

        <div className="p-4">
          <div className="max-h-[390px] space-y-3 overflow-auto rounded-md border border-border bg-bg-primary p-3">
            {assistantMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-md px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-8 bg-accent text-text-primary"
                    : "mr-8 border border-border bg-bg-surface text-text-primary"
                }`}
              >
                {message.content}
              </div>
            ))}
            {assistantStatus === "thinking" && (
              <div className="mr-8 rounded-md border border-border bg-bg-surface px-3 py-2 text-sm text-text-secondary">
                Reading that into the profile...
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendAssistantMessage();
            }}
            className="mt-3"
          >
            <label htmlFor="onboarding-assistant" className="mb-2 block text-sm font-medium text-text-primary">
              Tell the assistant what matters
            </label>
            <textarea
              id="onboarding-assistant"
              rows={4}
              value={assistantInput}
              onChange={(event) => setAssistantInput(event.target.value)}
              placeholder="Example: This is for Irie Transportation. I want content that helps people understand why booking a real owner-operator ride is better than gambling on Uber or Lyft."
              className="w-full resize-y rounded-md border border-border bg-bg-surface px-4 py-3 text-[15px] leading-[1.6] text-text-primary shadow-card placeholder:text-text-muted focus:border-accent"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={assistantStatus === "thinking" || !assistantInput.trim()}
                className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light disabled:opacity-50"
              >
                Send
              </button>
              <button
                type="button"
                onClick={() =>
                  sendAssistantMessage(
                    "This is for Irie Transportation. I want content that helps people understand why booking a real owner-operator ride is better than gambling on Uber or Lyft."
                  )
                }
                disabled={assistantStatus === "thinking"}
                className="min-h-11 rounded-md border border-border bg-bg-elevated px-4 text-sm text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-50"
              >
                Try Corey example
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-md border border-border-subtle bg-bg-elevated p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                Profile strength
              </p>
              <span className="text-sm font-medium text-text-primary">{readyScore}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-primary">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.max(8, Math.min(100, readyScore))}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-md border border-border bg-bg-surface p-3 shadow-card">
          {steps.map((step, index) => (
            <button
              key={step.label}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`mb-1 flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm transition-colors ${
                activeStep === index
                  ? "bg-bg-active text-text-primary"
                  : "text-text-secondary hover:bg-bg-hover"
              }`}
            >
              <span>{step.label}</span>
              <span className="text-xs text-text-muted">{index + 1}</span>
            </button>
          ))}
        </aside>

        <section className="rounded-md border border-border bg-bg-surface p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.18em] text-accent-deep">
            Step {activeStep + 1} of {steps.length}
          </p>
          <h2 className="mt-2 font-display text-2xl leading-tight text-text-primary">
            {current.title}
          </h2>
          <div className="mt-6">{current.body}</div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveStep((index) => Math.max(0, index - 1))}
                disabled={activeStep === 0}
                className="h-11 rounded-md border border-border bg-bg-surface px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() =>
                  activeStep === steps.length - 1
                    ? save()
                    : setActiveStep((index) => Math.min(steps.length - 1, index + 1))
                }
                disabled={status === "saving"}
                className="h-11 rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light disabled:opacity-60"
              >
                {activeStep === steps.length - 1
                  ? status === "saving"
                    ? "Saving..."
                    : "Save and continue"
                  : "Next"}
              </button>
            </div>
            {status === "error" && error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-primary">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-md border border-border bg-bg-surface px-4 text-[16px] text-text-primary shadow-card placeholder:text-text-muted focus:border-accent"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-primary">{label}</span>
      <textarea
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-border bg-bg-surface px-4 py-3 text-[15px] leading-[1.6] text-text-primary shadow-card placeholder:text-text-muted focus:border-accent"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-primary">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-md border border-border bg-bg-surface px-3 text-[15px] text-text-primary shadow-card focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function initialState(initial: InitialOnboarding): FormState {
  const profile = initial.profile;
  const links = initial.links
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "url" in item) {
        return String((item as { url?: unknown }).url ?? "");
      }
      return "";
    })
    .filter(Boolean);

  return {
    profileName: initial.name,
    personOrBrand: asString(profile.personOrBrand),
    whatYouDo: asString(profile.whatYouDo),
    audience: asString(profile.audience),
    offers: asString(profile.offers),
    goals: asString(profile.goals),
    platforms: asStringArray(profile.platforms, ["X", "LinkedIn", "Facebook", "Instagram"]),
    approvalPreference: asString(profile.approvalPreference) || "monthly",
    postingRhythm: asString(profile.postingRhythm),
    tone: asString(profile.tone),
    phrases: asString(profile.phrases),
    avoid: asString(profile.avoid),
    stories: asString(profile.stories),
    links: [...links, "", "", "", "", ""].slice(0, 5),
  };
}

function buildProfile(form: FormState) {
  return {
    personOrBrand: form.personOrBrand.trim(),
    whatYouDo: form.whatYouDo.trim(),
    audience: form.audience.trim(),
    offers: form.offers.trim(),
    goals: form.goals.trim(),
    platforms: form.platforms,
    approvalPreference: form.approvalPreference,
    postingRhythm: form.postingRhythm.trim(),
    tone: form.tone.trim(),
    phrases: form.phrases.trim(),
    avoid: form.avoid.trim(),
    stories: form.stories.trim(),
  };
}

function compileVoiceNotes(form: FormState) {
  return [
    `## Audience\n${form.audience || "Not answered yet."}`,
    `## Tone\n${form.tone || "Not answered yet."}`,
    `## Beliefs\n${form.goals || "Not answered yet."}`,
    `## Phrases\n${form.phrases || "Not answered yet."}`,
    `## Avoid\n${form.avoid || "Not answered yet."}`,
    `## Stories\n${form.stories || "Not answered yet."}`,
    `## Business Context\n${form.personOrBrand}\n\n${form.whatYouDo}\n\nOffers:\n${form.offers}`,
    `## Posting Preferences\nPlatforms: ${form.platforms.join(", ")}\nApproval: ${form.approvalPreference}\nRhythm: ${form.postingRhythm}`,
    `## Links\n${cleanLinks(form.links).map((link) => `- ${link}`).join("\n")}`,
  ]
    .join("\n\n")
    .slice(0, 20000);
}

function cleanLinks(links: string[]) {
  return links.map((link) => link.trim()).filter(Boolean).slice(0, 5);
}

function cleanDraftString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string");
  return items.length ? items : fallback;
}
