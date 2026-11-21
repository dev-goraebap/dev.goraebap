import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@goraebap/ui/components/button";
import { mdxComponents } from "@/components/mdx-components";
import { getPostBySlug } from "@/lib/posts";

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

  const { Content, raw } = post;

  async function handleCopyMarkdown() {
    try {
      await navigator.clipboard.writeText(raw);
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
              MDX 원문
            </button>
          </div>
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="border-border text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
          >
            {copied ? "복사됨" : "MDX 복사"}
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
        <section aria-label="에이전트용 MDX 원문" className="space-y-3">
          <p className="text-muted-foreground text-xs">
            실제{" "}
            <code className="bg-secondary rounded px-1 py-0.5 font-mono text-[11px]">
              content/posts/{post.slug}.mdx
            </code>{" "}
            파일 원문입니다. 사람과 에이전트가 동일한 파일을 읽습니다.
          </p>
          <pre className="border-border bg-secondary/50 text-foreground overflow-x-auto rounded-lg border p-5 font-mono text-xs leading-6">
            <code>{raw}</code>
          </pre>
        </section>
      ) : (
        <div>
          <Content components={mdxComponents} />
        </div>
      )}
    </article>
  );
}
