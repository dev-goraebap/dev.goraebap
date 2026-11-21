import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@goraebap/ui/components/button";
import { posts, type PostCategory } from "@/data/posts";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const categories: Array<"전체" | PostCategory> = ["전체", "아키텍처", "UI/UX", "에이전트"];

function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<"전체" | PostCategory>("전체");

  const filteredPosts =
    selectedCategory === "전체"
      ? posts
      : posts.filter((post) => post.category === selectedCategory);

  return (
    <div className="space-y-16">
      {/* Intro: restrained editorial orientation */}
      <section className="max-w-2xl space-y-4">
        <p className="text-blog-accent font-mono text-xs">WRITING · DESIGN SYSTEM · CONTEXT</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          생각의 기준을 글로 남기고,
          <br />
          직접 쓰는 UI를 템플릿으로 다듬습니다.
        </h1>
        <p className="text-muted-foreground text-[15px] leading-7">
          아키텍처 판단과 UI/UX 기준을 마크다운으로 기록해 사람과 에이전트가 같은 맥락을 읽도록
          만듭니다. 모든 예제는{" "}
          <code className="bg-secondary text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
            @goraebap/ui
          </code>
          에서 바로 실행됩니다.
        </p>
      </section>

      {/* Writing index */}
      <section aria-labelledby="writing-heading" className="space-y-5">
        <div className="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2.5">
            <h2 id="writing-heading" className="text-base font-semibold tracking-tight">
              글
            </h2>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {filteredPosts.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="주제 필터">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    active
                      ? "bg-primary text-primary-foreground cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                  }
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <ul className="divide-border/70 divide-y">
          {filteredPosts.map((post) => (
            <li key={post.slug}>
              <Link
                to="/posts/$slug"
                params={{ slug: post.slug }}
                className="group hover:bg-accent/60 -mx-3 flex flex-col gap-2 rounded-lg px-3 py-4 transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground group-hover:text-blog-accent text-[15px] font-medium tracking-tight transition-colors">
                      {post.title}
                    </span>
                    <span className="border-border text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
                      {post.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-1 text-sm">{post.summary}</p>
                </div>
                <div className="text-muted-foreground flex shrink-0 items-center gap-3 font-mono text-xs tabular-nums">
                  <span>{post.category}</span>
                  <span>{post.date}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Live UI & shadcn templates strip */}
      <section aria-labelledby="templates-heading" className="space-y-5">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div className="space-y-0.5">
            <h2 id="templates-heading" className="text-base font-semibold tracking-tight">
              UI & shadcn 템플릿
            </h2>
            <p className="text-muted-foreground text-xs">
              Base UI + Tailwind v4 기반. 레지스트리 JSON으로 다른 프로젝트에도 설치할 수 있습니다.
            </p>
          </div>
          <Link
            to="/ui"
            className="text-muted-foreground hover:text-foreground shrink-0 text-xs font-medium transition-colors"
          >
            전체 보기 →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-border bg-card flex flex-col justify-between gap-5 rounded-lg border p-5">
            <div className="bg-dots border-border/70 flex min-h-28 items-center justify-center gap-2 rounded-md border p-4">
              <Button size="sm">저장</Button>
              <Button size="sm" variant="outline">
                미리보기
              </Button>
              <Button size="sm" variant="ghost">
                취소
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium">Button</h3>
                <p className="text-muted-foreground text-xs">
                  Base UI 기반 프리미티브 · 5 variants
                </p>
              </div>
              <span className="bg-secondary text-muted-foreground rounded px-2 py-0.5 font-mono text-[11px]">
                registry:ui
              </span>
            </div>
          </div>

          <div className="border-border bg-card flex flex-col justify-between gap-5 rounded-lg border p-5">
            <div className="bg-dots border-border/70 flex min-h-28 flex-col justify-center gap-2 rounded-md border p-4">
              <div className="border-border bg-background flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                <span className="font-medium">문서 읽기 모드</span>
                <span className="bg-secondary text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                  Human / Agent
                </span>
              </div>
              <div className="border-border bg-background flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                <span className="text-muted-foreground">레지스트리 CLI 복사 바</span>
                <span className="text-blog-accent font-mono text-[10px]">Interactive</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium">Editorial Patterns</h3>
                <p className="text-muted-foreground text-xs">문서·블로그용 인터랙티브 패턴 묶음</p>
              </div>
              <Link to="/ui" className="text-blog-accent text-xs font-medium hover:underline">
                열기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
