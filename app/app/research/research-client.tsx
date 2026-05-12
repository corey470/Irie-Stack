"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InitialFuel } from "./page";

type Fuel = {
  id?: string | null;
  sourceType: "url" | "topic";
  source: string;
  title: string;
  summary: string;
  angles: string[];
  talkingPoints: string[];
  questions: string[];
  cautions: string[];
  sourceText?: string;
};

type Mode = "campaign" | "url" | "topic";
type Status = "idle" | "working" | "done" | "error";
type CampaignMessage = {
  role: "user" | "assistant";
  content: string;
};

const CAMPAIGN_TEMPLATES = [
  "Service explainer",
  "Founder note",
  "Customer problem",
  "Myth vs reality",
  "Local spotlight",
  "Offer / promotion",
  "FAQ article",
  "Product story",
];

const COREY_EXAMPLE =
  "I want a month of posts explaining why booking with a local owner-operator is better than gambling on Uber or Lyft for airport rides.";

export function ResearchClient({ initialFuels }: { initialFuels: InitialFuel[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("campaign");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [campaignTemplate, setCampaignTemplate] = useState(CAMPAIGN_TEMPLATES[0]);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignAudience, setCampaignAudience] = useState("");
  const [campaignOffer, setCampaignOffer] = useState("");
  const [campaignProof, setCampaignProof] = useState("");
  const [campaignPointOfView, setCampaignPointOfView] = useState("");
  const [campaignMessages, setCampaignMessages] = useState<CampaignMessage[]>([
    {
      role: "assistant",
      content:
        "Say what you want this month to be about. Keep it messy. I will turn it into a usable campaign brief.",
    },
  ]);
  const [campaignInput, setCampaignInput] = useState("");
  const [campaignChatStatus, setCampaignChatStatus] = useState<"idle" | "thinking" | "error">("idle");
  const [campaignReady, setCampaignReady] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [fuel, setFuel] = useState<Fuel | null>(null);
  const [sourceForPosts, setSourceForPosts] = useState("");
  const [savedFuels, setSavedFuels] = useState(initialFuels);
  const [error, setError] = useState<string | null>(null);

  async function harvest() {
    if (mode === "campaign" && campaignSubject.trim().length < 8) {
      setError("Add the service, product, idea, or campaign you want to turn into content.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("Add a URL first.");
      return;
    }
    if (mode === "topic" && topic.trim().length < 8) {
      setError("Add a topic with a little more detail.");
      return;
    }

    setStatus("working");
    setError(null);
    setFuel(null);
    setSourceForPosts("");

    try {
      const response = await fetch("/api/research/harvest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "campaign"
            ? {
                campaign: {
                  template: campaignTemplate,
                  subject: campaignSubject,
                  audience: campaignAudience,
                  offer: campaignOffer,
                  proof: campaignProof,
                  pointOfView: campaignPointOfView,
                },
              }
            : mode === "url"
              ? { url }
              : { topic }
        ),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not build content fuel.");

      setFuel(body.fuel);
      setSourceForPosts(body.sourceForPosts);
      if (body.fuel?.id) {
        setSavedFuels((current) => [
          {
            id: body.fuel.id,
            source_type: body.fuel.sourceType,
            source: body.fuel.source,
            title: body.fuel.title,
            summary: body.fuel.summary,
            angles: body.fuel.angles,
            talking_points: body.fuel.talkingPoints,
            questions: body.fuel.questions,
            cautions: body.fuel.cautions,
            source_text: body.fuel.sourceText,
            created_at: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 8));
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not build content fuel.");
    }
  }

  function sendToCreatePosts(source = sourceForPosts) {
    if (!source) return;
    window.localStorage.setItem("iriestack.contentFuel", source);
    router.push("/app/generate");
  }

  function applyCampaignDraft(draft: {
    template?: string;
    subject?: string;
    audience?: string;
    offer?: string;
    proof?: string;
    pointOfView?: string;
  }) {
    if (draft.template && CAMPAIGN_TEMPLATES.includes(draft.template)) setCampaignTemplate(draft.template);
    if (draft.subject) setCampaignSubject(draft.subject);
    if (draft.audience) setCampaignAudience(draft.audience);
    if (draft.offer) setCampaignOffer(draft.offer);
    if (draft.proof) setCampaignProof(draft.proof);
    if (draft.pointOfView) setCampaignPointOfView(draft.pointOfView);
    setError(null);
  }

  async function sendCampaignMessage(message = campaignInput) {
    const cleanMessage = message.trim();
    if (!cleanMessage || campaignChatStatus === "thinking") return;

    const nextMessages: CampaignMessage[] = [
      ...campaignMessages,
      { role: "user", content: cleanMessage },
    ];
    setCampaignMessages(nextMessages);
    setCampaignInput("");
    setCampaignChatStatus("thinking");
    setError(null);

    try {
      const response = await fetch("/api/research/campaign-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          draft: {
            template: campaignTemplate,
            subject: campaignSubject,
            audience: campaignAudience,
            offer: campaignOffer,
            proof: campaignProof,
            pointOfView: campaignPointOfView,
          },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not shape that campaign.");

      applyCampaignDraft(body.draft ?? {});
      setCampaignReady(Boolean(body.ready));
      const reply = [body.reply, body.nextQuestion].filter(Boolean).join("\n\n");
      setCampaignMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply || "Good. I can build the campaign from this.",
        },
      ]);
    } catch (err) {
      setCampaignChatStatus("error");
      setError(err instanceof Error ? err.message : "Could not shape that campaign.");
      return;
    }

    setCampaignChatStatus("idle");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(360px,0.82fr)_minmax(420px,1.18fr)]">
      <section className="rounded-md border border-border bg-bg-surface shadow-card">
        <div className="border-b border-border-subtle p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">
            Start here
          </p>
          <h2 className="mt-1 text-xl font-semibold text-text-primary">
            What should this month do?
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            Bring in customers, explain an offer, build trust, answer questions,
            or launch something new.
          </p>
        </div>

        <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {(["campaign", "url", "topic"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setError(null);
              }}
              className={`h-10 rounded-md border px-4 text-sm font-medium transition-colors ${
                mode === item
                  ? "border-border-strong bg-bg-active text-text-primary"
                  : "border-border bg-bg-surface text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {item === "campaign" ? "Talk it out" : item === "url" ? "Use a link" : "Use a topic"}
            </button>
          ))}
        </div>

        {mode === "campaign" ? (
          <div className="space-y-3">
            <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-border bg-bg-primary p-3">
              {campaignMessages.map((message, index) => (
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
              {campaignChatStatus === "thinking" && (
                <div className="mr-8 rounded-md border border-border bg-bg-surface px-3 py-2 text-sm text-text-secondary">
                  Thinking through the campaign...
                </div>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendCampaignMessage();
              }}
              className="rounded-md border border-border bg-bg-surface p-3 shadow-card"
            >
              <label htmlFor="campaign-chat" className="mb-2 block text-sm font-medium text-text-primary">
                Type the rough idea
              </label>
              <textarea
                id="campaign-chat"
                rows={2}
                value={campaignInput}
                onChange={(event) => setCampaignInput(event.target.value)}
                placeholder="Example: I want posts about why my service is safer, simpler, or more trustworthy than the usual option."
                className="w-full resize-y rounded-md border border-border bg-bg-surface px-4 py-3 text-[15px] leading-[1.6] text-text-primary shadow-card placeholder:text-text-muted focus:border-accent"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={campaignChatStatus === "thinking" || !campaignInput.trim()}
                  className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light disabled:opacity-50"
                >
                  Send to assistant
                </button>
                <button
                  type="button"
                  onClick={() =>
                    sendCampaignMessage(
                      COREY_EXAMPLE
                    )
                  }
                  disabled={campaignChatStatus === "thinking"}
                  className="min-h-11 rounded-md border border-border bg-bg-elevated px-4 text-sm text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-50"
                >
                  Try example
                </button>
              </div>
            </form>

            <details className="rounded-md border border-border-subtle bg-bg-elevated">
              <summary className="cursor-pointer list-none p-3 text-sm font-medium text-accent-deep">
                View the brief IrieStack is building
              </summary>
              <div className="border-t border-border-subtle p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                  Campaign brief
                </p>
                {campaignReady && (
                  <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-success">
                    Ready
                  </span>
                )}
              </div>
              <BriefLine label="Type" value={campaignTemplate} />
              <BriefLine label="Subject" value={campaignSubject} />
              <BriefLine label="Audience" value={campaignAudience} />
              <BriefLine label="Next step" value={campaignOffer} />
              <BriefLine label="Proof" value={campaignProof} />
              <BriefLine label="Take" value={campaignPointOfView} />
              </div>
            </details>
          </div>
        ) : mode === "url" ? (
          <div>
            <label htmlFor="research-url" className="mb-2 block text-sm font-medium text-text-primary">
              Link to research
            </label>
            <input
              id="research-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/article"
              className="h-12 w-full rounded-md border border-border bg-bg-surface px-4 text-[16px] text-text-primary shadow-card placeholder:text-text-muted focus:border-accent"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="research-topic" className="mb-2 block text-sm font-medium text-text-primary">
              Topic to explore
            </label>
            <textarea
              id="research-topic"
              rows={7}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Example: why small business owners need automated social posting without losing their voice"
              className="w-full resize-y rounded-md border border-border bg-bg-surface px-4 py-3 text-[15px] leading-[1.6] text-text-primary shadow-card placeholder:text-text-muted focus:border-accent"
            />
          </div>
        )}

          <div className="-mx-4 mt-4 border-t border-border-subtle bg-bg-surface/95 px-4 py-3 backdrop-blur md:sticky md:bottom-0">
            <button
              type="button"
              onClick={harvest}
              disabled={status === "working"}
              className="h-12 w-full rounded-md bg-accent px-5 text-sm font-medium text-text-primary shadow-card transition-colors hover:bg-accent-light disabled:opacity-60 sm:w-auto"
            >
              {status === "working" ? "Building..." : mode === "campaign" ? "Build the source" : "Build the source"}
            </button>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              This makes the source. The next screen turns it into the 30-day
              calendar.
            </p>
          </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        </div>
      </section>

      <section className="rounded-md border border-border bg-bg-surface p-5 shadow-card lg:sticky lg:top-4 lg:self-start">
        {!fuel ? (
          <div className="flex min-h-[220px] items-center justify-center text-center">
            <div>
              <h2 className="font-display text-2xl text-text-primary">
                Your source will show here.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                When it is ready, press “Build the month” and IrieStack makes
                the calendar.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                  {fuel.source.startsWith("Campaign:")
                    ? "Campaign Source"
                    : fuel.sourceType === "url"
                      ? "Harvested URL"
                      : "Topic Fuel"}
                </p>
                <h2 className="font-display text-2xl leading-tight text-text-primary">
                  {fuel.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {fuel.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => sendToCreatePosts()}
                className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light"
              >
                Build the month
              </button>
            </div>

            {fuel.source.startsWith("Campaign:") && fuel.sourceText && (
              <div className="border-b border-border-subtle py-4">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">
                  Source Draft
                </h3>
                <div className="whitespace-pre-wrap rounded-md border border-border bg-bg-elevated p-4 text-sm leading-relaxed text-text-primary">
                  {fuel.sourceText}
                </div>
              </div>
            )}
            <details className="group">
              <summary className="cursor-pointer border-b border-border-subtle py-4 text-sm font-medium text-accent-deep">
                Show the research notes
              </summary>
              <FuelList title="Post Angles" items={fuel.angles} />
              <FuelList title="Talking Points" items={fuel.talkingPoints} />
              <FuelList title="Questions to Explore" items={fuel.questions} />
              <FuelList title="Guardrails" items={fuel.cautions} />
            </details>
          </div>
        )}
      </section>

      {savedFuels.length > 0 && (
        <details className="lg:col-span-2">
          <summary className="cursor-pointer text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
            Saved Sources
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {savedFuels.map((item) => (
              <article
                key={item.id}
                className="rounded-md border border-border bg-bg-surface p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-text-muted">
                      {item.source.startsWith("Campaign:")
                        ? "Campaign"
                        : item.source_type === "url"
                          ? "URL"
                          : "Topic"} ·{" "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1 max-h-11 overflow-hidden text-sm leading-relaxed text-text-secondary">
                      {item.summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => sendToCreatePosts(savedFuelToSource(item))}
                    className="shrink-0 rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-hover"
                  >
                    Build month
                  </button>
                </div>
              </article>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function FuelList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-b border-border-subtle py-4 last:border-b-0">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-text-primary">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BriefLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border-subtle py-2 first:border-t-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm leading-relaxed text-text-primary">
        {value.trim() || "Assistant will fill this in."}
      </p>
    </div>
  );
}

function savedFuelToSource(fuel: InitialFuel) {
  const ownedDraft =
    fuel.source.startsWith("Campaign:") && fuel.source_text?.trim()
      ? `\nOwned source draft:\n${fuel.source_text.trim()}\n`
      : "";

  return `Research fuel: ${fuel.title}

Source: ${fuel.source}

Summary:
${fuel.summary}
${ownedDraft}

Original post angles to explore:
${fuel.angles.map((item) => `- ${item}`).join("\n")}

Talking points:
${fuel.talking_points.map((item) => `- ${item}`).join("\n")}

Useful questions:
${fuel.questions.map((item) => `- ${item}`).join("\n")}

Important guardrails:
${fuel.cautions.map((item) => `- ${item}`).join("\n")}

Create original posts in my voice from these ideas. Do not copy the source wording.`;
}
