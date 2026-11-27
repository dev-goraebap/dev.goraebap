import { useEffect, useState } from "react";
import { Link, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Button } from "@goraebap/ui-react/components/button";
import { Input } from "@goraebap/ui-react/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui-react/components/table";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { menuDocs } from "@/entities/content-doc";
import {
  GLOSSARY_DOMAINS,
  GLOSSARY_ENTRIES,
  type GlossaryEntry,
} from "@/shared/lib/glossary";

const COMPONENT_TITLES = new Map(
  menuDocs("design-system/components").map((doc) => [doc.slug, doc.meta.title ?? doc.slug]),
);

const VALID_DOMAINS = new Set(GLOSSARY_DOMAINS.map((domain) => domain.id));

export const Route = createFileRoute("/glossary/")({
  validateSearch: (search: Record<string, unknown>): { domain?: string; category?: string } => {
    const domain =
      typeof search.domain === "string" && VALID_DOMAINS.has(search.domain)
        ? search.domain
        : undefined;
    const category =
      domain && typeof search.category === "string" && search.category.length > 0
        ? search.category
        : undefined;
    return { domain, category };
  },
  component: GlossaryPage,
});

function domainBadgeVariant(domain: string): "secondary" | "outline" {
  return domain === "frontend" || domain === "backend" ? "secondary" : "outline";
}

function matchesQuery(entry: GlossaryEntry, normalized: string): boolean {
  if (!normalized) return true;
  if (entry.korean?.toLowerCase().includes(normalized)) return true;
  if (entry.term.toLowerCase().includes(normalized)) return true;
  if (entry.domainLabel.toLowerCase().includes(normalized)) return true;
  if (entry.category.toLowerCase().includes(normalized)) return true;
  if (entry.definition.toLowerCase().includes(normalized)) return true;
  if (entry.distinction?.toLowerCase().includes(normalized)) return true;
  if (
    entry.stacks &&
    Object.entries(entry.stacks).some(
      ([stack, mapping]) =>
        stack.toLowerCase().includes(normalized) || mapping.toLowerCase().includes(normalized),
    )
  ) {
    return true;
  }
  if (
    entry.components?.some(
      (slug) =>
        slug.toLowerCase().includes(normalized) ||
        (COMPONENT_TITLES.get(slug)?.toLowerCase().includes(normalized) ?? false),
    )
  ) {
    return true;
  }
  return false;
}

function GlossaryPage() {
  const { domain, category } = Route.useSearch();
  const navigate = useNavigate({ from: "/glossary/" });
  const hash = useLocation({ select: (location) => location.hash });
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const activeDomain = GLOSSARY_DOMAINS.find((item) => item.id === domain);
  const availableCategories = activeDomain?.categories ?? [];
  const activeCategory =
    category && availableCategories.includes(category) ? category : undefined;

  const filtered = GLOSSARY_ENTRIES.filter(
    (entry) =>
      (!domain || entry.domain === domain) &&
      (!activeCategory || entry.category === activeCategory) &&
      matchesQuery(entry, normalized),
  );

  const hasFilter = Boolean(domain || activeCategory || normalized);

  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hash]);

  function selectDomain(nextDomain?: string) {
    void navigate({
      search: nextDomain ? { domain: nextDomain } : {},
      replace: true,
    });
  }

  function selectCategory(nextCategory?: string) {
    if (!domain) return;
    void navigate({
      search: nextCategory ? { domain, category: nextCategory } : { domain },
      replace: true,
    });
  }

  function resetFilters() {
    setQuery("");
    void navigate({ search: {}, replace: true });
  }

  return (
    <article className="mx-auto max-w-6xl space-y-8 px-5 py-10 sm:px-6 sm:py-14">
      <header className="space-y-2.5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight">용어집</h1>
          <span className="text-muted-foreground text-sm font-medium tabular-nums">
            {GLOSSARY_ENTRIES.length}개 용어
          </span>
        </div>
        <p className="text-muted-foreground max-w-3xl text-base leading-relaxed break-keep sm:text-lg">
          프론트엔드·백엔드·디자인 시스템 등 문서 전반에서 같은 개념을 같은 이름으로 부르기 위해 한곳에 모아 둔 통합 용어집입니다.
        </p>
      </header>

      <section aria-label="용어 필터" className="space-y-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SystemIcon
              name="search"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="용어, 영문, 분류, 정의, 스택 매핑으로 검색"
              aria-label="통합 용어집 검색"
              className="bg-card h-10 rounded-xl pl-10"
            />
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
            <span className="text-muted-foreground text-xs font-medium tabular-nums">
              표시 {filtered.length} / {GLOSSARY_ENTRIES.length}
            </span>
            {hasFilter && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetFilters}
                className="h-8 gap-1 px-2.5 text-xs"
              >
                <SystemIcon name="reset" className="size-3.5" />
                초기화
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div role="group" aria-label="영역 선택" className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              shape="pill"
              variant={!domain ? "default" : "outline"}
              aria-pressed={!domain}
              onClick={() => selectDomain(undefined)}
              className="h-7 px-3 text-xs"
            >
              전체
              <span className="ml-1 opacity-70 tabular-nums">{GLOSSARY_ENTRIES.length}</span>
            </Button>
            {GLOSSARY_DOMAINS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                shape="pill"
                variant={domain === item.id ? "default" : "outline"}
                aria-pressed={domain === item.id}
                onClick={() => selectDomain(item.id)}
                className="h-7 px-3 text-xs"
              >
                {item.label}
                <span className="ml-1 opacity-70 tabular-nums">{item.count}</span>
              </Button>
            ))}
          </div>

          {availableCategories.length > 0 && (
            <div
              role="group"
              aria-label="세부 분류 선택"
              className="flex flex-wrap items-center gap-1.5"
            >
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant={!activeCategory ? "secondary" : "ghost"}
                aria-pressed={!activeCategory}
                onClick={() => selectCategory(undefined)}
                className="h-7 px-2.5 text-xs"
              >
                전체 분류
              </Button>
              {availableCategories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  shape="pill"
                  variant={activeCategory === cat ? "secondary" : "ghost"}
                  aria-pressed={activeCategory === cat}
                  onClick={() => selectCategory(cat)}
                  className="h-7 px-2.5 text-xs"
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>
      </section>

      {filtered.length > 0 ? (
        <div className="border-border bg-card overflow-x-auto rounded-2xl border">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48 pl-5">용어</TableHead>
                <TableHead className="w-40">영역 · 분류</TableHead>
                <TableHead className="min-w-[20rem]">정의 · 구분</TableHead>
                <TableHead className="w-72 pr-5">메타데이터</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => {
                const isTarget = entry.id === hash;
                const stackEntries = entry.stacks ? Object.entries(entry.stacks) : [];
                const hasMeta = stackEntries.length > 0 || (entry.components?.length ?? 0) > 0;

                return (
                  <TableRow
                    key={`${entry.domain}:${entry.id}`}
                    id={entry.id}
                    className={`scroll-mt-24 transition-colors ${isTarget ? "bg-accent/55" : ""}`}
                  >
                    <TableCell className="py-4 pl-5 align-top whitespace-normal">
                      <div className="space-y-0.5">
                        <span className="text-foreground block text-sm font-semibold break-keep">
                          {entry.korean ?? entry.term}
                        </span>
                        {entry.korean && (
                          <span className="text-muted-foreground block text-xs leading-snug break-words">
                            {entry.term}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-4 align-top whitespace-normal">
                      <div className="flex flex-col items-start gap-1.5">
                        <button
                          type="button"
                          onClick={() => selectDomain(entry.domain)}
                          className="cursor-pointer"
                          title={`${entry.domainLabel} 영역으로 필터`}
                        >
                          <Badge variant={domainBadgeVariant(entry.domain)} className="text-[0.6875rem]">
                            {entry.domainLabel}
                          </Badge>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void navigate({
                              search: { domain: entry.domain, category: entry.category },
                              replace: true,
                            })
                          }
                          className="text-muted-foreground hover:text-foreground cursor-pointer text-left text-xs leading-snug break-keep transition-colors"
                          title={`${entry.category} 분류로 필터`}
                        >
                          {entry.category}
                        </button>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 align-top whitespace-normal">
                      <div className="space-y-2">
                        <p className="text-foreground/90 text-sm leading-relaxed break-keep">
                          {entry.definition}
                        </p>
                        {entry.distinction && (
                          <p className="text-muted-foreground text-xs leading-relaxed break-keep">
                            <span className="text-foreground/75 mr-1.5 font-medium">구분</span>
                            {entry.distinction}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-4 pr-5 align-top whitespace-normal">
                      {hasMeta ? (
                        <div className="space-y-2.5">
                          {stackEntries.length > 0 && (
                            <dl className="space-y-1.5 text-xs">
                              {stackEntries.map(([stackName, mapping]) => (
                                <div key={stackName} className="space-y-0.5">
                                  <dt className="text-foreground font-medium">{stackName}</dt>
                                  <dd className="text-muted-foreground leading-relaxed break-keep">
                                    {mapping}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                          {entry.components && entry.components.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {entry.components.map((slug) => (
                                <Link
                                  key={slug}
                                  to="/design-system/components/$slug"
                                  params={{ slug }}
                                  className="border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium transition-colors"
                                >
                                  {COMPONENT_TITLES.get(slug) ?? slug}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border-border text-muted-foreground space-y-3 rounded-2xl border border-dashed p-12 text-center text-sm">
          <p>조건에 해당하는 용어가 없습니다.</p>
          {hasFilter && (
            <Button type="button" size="sm" variant="outline" onClick={resetFilters}>
              필터 초기화
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
