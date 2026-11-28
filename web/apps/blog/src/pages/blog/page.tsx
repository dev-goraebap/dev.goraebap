import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { diataxisDocHref, diataxisSectionDocs } from "@/entities/diataxis-doc";
import { blogPosts, docHref } from "@/entities/content-doc";
import { DominantColorImage, PromoBannerCard } from "@/shared/ui";

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
  thumbnailColor?: string;
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
    thumbnailColor: post.meta.thumbnailColor,
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
    thumbnailColor: doc.meta.thumbnailColor,
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
    thumbnailColor: doc.meta.thumbnailColor,
  }));

  return [...own, ...frontend, ...backend];
}

const FEED_ITEMS = buildFeed();

const RAW_TAG_FILTERS: { id: FeedSource | null; label: string; count: number }[] = [
  { id: null, label: "전체", count: FEED_ITEMS.length },
  {
    id: "blog",
    label: "블로그",
    count: FEED_ITEMS.filter((item) => item.source === "blog").length,
  },
  {
    id: "frontend",
    label: "프론트엔드",
    count: FEED_ITEMS.filter((item) => item.source === "frontend").length,
  },
  {
    id: "backend",
    label: "백엔드",
    count: FEED_ITEMS.filter((item) => item.source === "backend").length,
  },
];

const TAG_FILTERS = RAW_TAG_FILTERS.filter((entry) => entry.id === null || entry.count > 0);

const DESIGN_SYSTEM_PROMO = {
  imageSrc: "/banners/design-system-beta.jpg",
  imageAlt: "디자인 시스템 Beta 모듈형 UI 블록 일러스트",
  imageColor: "#F5F1E6",
  title: "디자인 시스템",
  badge: "Beta",
  description:
    "React와 Angular에서 같은 스타일 레시피를 쓰는 컴포넌트·레이아웃·화면 패턴을 미리 둘러볼 수 있습니다.",
  ctaLabel: "디자인 시스템 둘러보기",
  ctaTo: "/webapp/design-system/overview",
} as const;

function TagFilterGroup({
  filter,
  onChange,
  variant = "inline",
}: {
  filter: FeedSource | null;
  onChange: (next: FeedSource | null) => void;
  variant?: "inline" | "rail";
}) {
  return (
    <div
      role="group"
      aria-label="태그 필터"
      className={variant === "rail" ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-1.5 xl:hidden"}
    >
      {TAG_FILTERS.map((entry) => {
        const active = filter === entry.id;
        return (
          <Button
            key={entry.id ?? "all"}
            type="button"
            size="sm"
            shape="pill"
            variant={active ? "default" : "outline"}
            aria-pressed={active}
            onClick={() => onChange(entry.id)}
            className="h-7 gap-1.5 px-3 text-xs"
          >
            <span>{entry.label}</span>
            <span
              className={
                active
                  ? "text-primary-foreground/75 font-mono text-[0.6875rem]"
                  : "text-muted-foreground font-mono text-[0.6875rem]"
              }
            >
              {entry.count}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

function BlogListPage() {
  const [filter, setFilter] = useState<FeedSource | null>(null);
  const items = filter ? FEED_ITEMS.filter((item) => item.source === filter) : FEED_ITEMS;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
      <div className="flex items-start gap-12">
        <article className="min-w-0 flex-1 space-y-10">
          <header className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">블로그</h1>
              <p className="text-muted-foreground text-lg leading-relaxed break-keep">
                설계와 구현에 대한 생각, 프론트엔드·백엔드 아티클을 한곳에 모아 둡니다.
              </p>
            </div>
            <TagFilterGroup filter={filter} onChange={setFilter} variant="inline" />
          </header>

          <ul className="divide-border grid grid-cols-1 divide-y sm:grid-cols-2 sm:gap-6 sm:divide-y-0">
            {items.map((item) => (
              <li key={item.id} className="py-7 first:pt-0 last:pb-0 sm:py-0">
                <Link
                  to={item.href}
                  className="group corner-squircle sm:border-border sm:hover:border-foreground/20 bg-background sm:hover:bg-muted/65 flex h-full flex-col transition-colors duration-200 sm:rounded-[28px] sm:border sm:p-3.5"
                >
                  {item.thumbnail ? (
                    <DominantColorImage
                      src={item.thumbnail}
                      alt={item.title}
                      dominantColor={item.thumbnailColor}
                      className="corner-squircle aspect-[16/9] w-full rounded-[18px]"
                      imgClassName="group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="corner-squircle bg-muted/40 aspect-[16/9] w-full rounded-[18px]" />
                  )}
                  <div className="flex flex-1 flex-col gap-2 pt-4 sm:px-1.5 sm:pb-2">
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

          <div className="xl:hidden">
            <PromoBannerCard {...DESIGN_SYSTEM_PROMO} />
          </div>
        </article>

        <aside
          aria-label="블로그 필터와 안내"
          className="hidden w-64 shrink-0 xl:sticky xl:top-[calc(3.5rem+2.5rem)] xl:block"
        >
          <div className="max-h-[calc(100dvh-7rem)] space-y-7 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <section aria-label="태그 필터" className="space-y-3">
              <p className="text-muted-foreground text-xs font-semibold">태그</p>
              <TagFilterGroup filter={filter} onChange={setFilter} variant="rail" />
            </section>
            <PromoBannerCard {...DESIGN_SYSTEM_PROMO} />
          </div>
        </aside>
      </div>
    </div>
  );
}
