import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@goraebap/ui/components/button";
import { getPostBySlug, serializePostToMarkdown } from "@/data/posts";

export const Route = createFileRoute("/posts/$slug")({
  component: PostDetailPage,
});

function PostDetailPage() {
  const { slug } = Route.useParams();
  const post = getPostBySlug(slug);
  const [viewMode, setViewMode] = useState<"human" | "agent">("human");
  const [copied, setCopied] = useState(false);

  if (!post) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">글을 찾을 수 없습니다.</h1>
        <Button render={<Link to="/" />} nativeButton={false} variant="outline" size="sm">
          ← 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const rawMarkdown = serializePostToMarkdown(post);

  async function handleCopyMarkdown() {
    try {
      await navigator.clipboard.writeText(rawMarkdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="mx-auto max-w-[68ch] space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
        >
          ← 글 목록
        </Link>

        {/* Signature: Human reading view <-> Agent Markdown view */}
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="보기 모드"
            className="border-border bg-secondary/60 inline-flex rounded-md border p-0.5 text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "human"}
              onClick={() => setViewMode("human")}
              className={
                viewMode === "human"
                  ? "bg-background text-foreground cursor-pointer rounded px-2.5 py-1 font-medium shadow-xs"
                  : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2.5 py-1"
              }
            >
              읽기
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "agent"}
              onClick={() => setViewMode("agent")}
              className={
                viewMode === "agent"
                  ? "bg-background text-foreground cursor-pointer rounded px-2.5 py-1 font-mono font-medium shadow-xs"
                  : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2.5 py-1 font-mono"
              }
            >
              Markdown
            </button>
          </div>
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="border-border text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
          >
            {copied ? "복사됨" : "MD 복사"}
          </button>
        </div>
      </div>

      <header className="border-border space-y-4 border-b pb-8">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums">
          <span className="text-blog-accent">{post.category}</span>
          <span>·</span>
          <span>{post.date}</span>
          <span>·</span>
          <span>읽기 {post.readingTime}</span>
          <span>·</span>
          <span className="border-border rounded border px-1.5 py-0.5 text-[11px]">
            {post.status}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{post.title}</h1>
        <p className="text-muted-foreground text-[15px] leading-7">{post.summary}</p>
      </header>

      {viewMode === "agent" ? (
        <section aria-label="에이전트용 마크다운 원문" className="space-y-3">
          <p className="text-muted-foreground text-xs">
            에이전트가 맥락으로 참조하는 원문 형식입니다. frontmatter의 상태와 요약으로 관련 글을
            선별합니다.
          </p>
          <pre className="border-border bg-secondary/50 text-foreground overflow-x-auto rounded-lg border p-5 font-mono text-xs leading-6">
            <code>{rawMarkdown}</code>
          </pre>
        </section>
      ) : (
        <div className="space-y-10">
          {post.sections.map((section) => (
            <section key={section.heading} className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-foreground/90 text-base leading-[1.75]">
                  {paragraph}
                </p>
              ))}
              {section.quote ? (
                <blockquote className="border-blog-accent text-muted-foreground border-l-2 pl-4 text-[15px] leading-7 italic">
                  {section.quote}
                </blockquote>
              ) : null}
              {section.code ? (
                <div className="border-border bg-secondary/40 overflow-hidden rounded-lg border">
                  <div className="border-border/80 text-muted-foreground border-b px-4 py-2 font-mono text-[11px]">
                    {section.code.filename}
                  </div>
                  <pre className="text-foreground overflow-x-auto p-4 font-mono text-xs leading-6">
                    <code>{section.code.content}</code>
                  </pre>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </article>
  );
}
