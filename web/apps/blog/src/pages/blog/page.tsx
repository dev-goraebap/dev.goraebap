import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { diataxisDocHref, diataxisSectionDocs } from "@/entities/diataxis-doc";
import { blogPosts, docHref } from "@/entities/content-doc";

export const Route = createFileRoute("/blog/")({
  component: BlogListPage,
});

type FeedSource = "blog" | "backend" | "frontend";

interface FeedItem {
  id: string;
  source: FeedSource;
  sourceLabel: string;
  title: string;
  summary?: string;
  href: string;
  date?: string;
  thumbnail?: string;
}

function buildFeed(): FeedItem[] {
  const own: FeedItem[] = blogPosts().map((post) => ({
    id: `blog:${post.slug}`,
    source: "blog",
    sourceLabel: "블로그",
    title: post.meta.title ?? post.slug,
    summary: post.meta.summary,
    href: docHref(post, ""),
    date: post.meta.date,
    thumbnail: post.meta.thumbnail,
  }));

  const frontend: FeedItem[] = diataxisSectionDocs("frontend", "articles").map((doc) => ({
    id: `frontend:${doc.slug}`,
    source: "frontend",
    sourceLabel: "프론트엔드 아티클",
    title: doc.meta.title ?? doc.slug,
    summary: doc.meta.summary,
    href: diataxisDocHref(doc),
    date: doc.meta.date,
    thumbnail: doc.meta.thumbnail,
  }));

  const backend: FeedItem[] = diataxisSectionDocs("backend", "articles").map((doc) => ({
    id: `backend:${doc.slug}`,
    source: "backend",
    sourceLabel: "백엔드 아티클",
    title: doc.meta.title ?? doc.slug,
    summary: doc.meta.summary,
    href: diataxisDocHref(doc),
    date: doc.meta.date,
    thumbnail: doc.meta.thumbnail,
  }));

  return [...own, ...frontend, ...backend];
}

const FEED_ITEMS = buildFeed();

const FILTERS: { id: FeedSource | null; label: string }[] = [
  { id: null, label: "전체" },
  { id: "blog", label: "블로그" },
  { id: "frontend", label: "프론트엔드" },
  { id: "backend", label: "백엔드" },
];

function BlogListPage() {
  const [filter, setFilter] = useState<FeedSource | null>(null);

  const availableFilters = FILTERS.filter(
    (entry) => entry.id === null || FEED_ITEMS.some((item) => item.source === entry.id),
  );
  const items = filter ? FEED_ITEMS.filter((item) => item.source === filter) : FEED_ITEMS;

  return (
    <article className="mx-auto max-w-5xl space-y-10 px-6 py-12 sm:py-16">
      <header className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">블로그</h1>
          <p className="text-muted-foreground text-lg leading-relaxed break-keep">
            설계와 구현에 대한 생각, 프론트엔드·백엔드 아티클을 한곳에 모아 둡니다.
          </p>
        </div>
        <div role="group" aria-label="글 분류 선택" className="flex flex-wrap gap-1.5">
          {availableFilters.map((entry) => (
            <Button
              key={entry.id ?? "all"}
              type="button"
              size="sm"
              shape="pill"
              variant={filter === entry.id ? "default" : "outline"}
              aria-pressed={filter === entry.id}
              onClick={() => setFilter(entry.id)}
              className="h-7 px-3 text-xs"
            >
              {entry.label}
            </Button>
          ))}
        </div>
      </header>

      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.href}
              className="group corner-squircle border-border hover:border-foreground/20 bg-background hover:bg-muted/65 flex h-full flex-col rounded-[28px] border p-3.5 transition-colors duration-200"
            >
              <div className="corner-squircle bg-muted/40 aspect-[16/9] w-full overflow-hidden rounded-[18px]">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="size-full" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 px-1.5 pt-4 pb-2">
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <span>{item.sourceLabel}</span>
                  {item.date && (
                    <>
                      <span aria-hidden="true">·</span>
                      <time dateTime={item.date}>{item.date}</time>
                    </>
                  )}
                </div>
                <h2 className="text-foreground text-lg leading-snug font-semibold tracking-tight break-keep group-hover:underline group-hover:underline-offset-4">
                  {item.title}
                </h2>
                {item.summary && (
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed break-keep">
                    {item.summary}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
