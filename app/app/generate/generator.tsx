"use client";

import { useState } from "react";

type Post = { platform: string; body: string };
type Status = "idle" | "running" | "done" | "error";

const SAMPLE = `From a Tuesday voice memo:

Three years building solo taught me one thing — the work that compounds isn't the work that's loudest. It's the work that's consistent. Showing up Tuesday after Tuesday — even when nobody's watching — is the whole job.`;

export function Generator() {
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  async function generate() {
    if (source.trim().length < 20) {
      setError("Add at least 20 characters of source content.");
      return;
    }
    setStatus("running");
    setError(null);
    setPosts([]);
    setElapsed(0);

    const start = Date.now();
    const tick = setInterval(() => {
      setElapsed(Math.round((Date.now() - start) / 1000));
    }, 250);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Generation failed.");

      setPosts(body.posts ?? []);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      clearInterval(tick);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="source"
            className="block text-sm font-medium text-text-primary"
          >
            Source content
          </label>
          {!source && (
            <button
              type="button"
              onClick={() => setSource(SAMPLE)}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Use a sample
            </button>
          )}
        </div>
        <textarea
          id="source"
          rows={12}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          maxLength={12000}
          disabled={status === "running"}
          placeholder="Paste a transcript, a blog draft, a half-formed thought…"
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-[15px] leading-[1.6] text-text-primary placeholder:text-text-muted shadow-card transition-colors focus:border-accent resize-y disabled:opacity-60"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>{source.length.toLocaleString()} / 12,000</span>
          <span>Min 20 chars</span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={generate}
            disabled={status === "running" || source.trim().length < 20}
            className="h-12 rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all hover:bg-accent-light hover:shadow-card-hover disabled:opacity-60"
          >
            {status === "running"
              ? `Generating… ${elapsed}s`
              : "Generate posts"}
          </button>
          {status === "done" && posts.length > 0 && (
            <span className="text-sm text-text-muted">
              {posts.length} posts · ready
            </span>
          )}
          {error && (
            <span role="alert" className="text-sm text-destructive">
              {error}
            </span>
          )}
        </div>
      </section>

      {status === "running" && (
        <section>
          <p className="text-sm text-text-secondary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent mr-2 align-middle animate-pulse" />
            Rewriting for LinkedIn, X, Threads, Newsletter, Instagram —
            usually 8–15 seconds.
          </p>
        </section>
      )}

      {posts.length > 0 && <Outputs posts={posts} />}
    </div>
  );
}

function Outputs({ posts }: { posts: Post[] }) {
  return (
    <section>
      <header className="mb-6 flex items-baseline gap-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.22em] text-accent-deep">
          Output
        </h2>
        <span className="h-px flex-1 bg-border-subtle" />
      </header>
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.platform} post={post} />
        ))}
      </div>
    </section>
  );
}

function PostCard({ post }: { post: Post }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(post.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <article className="border-t border-border-subtle pt-5">
      <header className="mb-3 flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          {post.platform}
        </span>
        <span aria-hidden="true" className="block h-px flex-1 bg-border-subtle" />
        <span className="text-[11px] text-text-muted">
          {post.body.length} chars
        </span>
        <button
          type="button"
          onClick={copy}
          className="text-[11px] text-text-secondary hover:text-text-primary transition-colors uppercase tracking-wider"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </header>
      <p className="whitespace-pre-wrap text-[15px] leading-[1.65] text-text-primary">
        {post.body}
      </p>
    </article>
  );
}
