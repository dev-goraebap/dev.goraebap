import { useState } from "react";
import { Link, createFileRoute, useLocation } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { Input } from "@goraebap/ui-react/components/input";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { menuDocs } from "@/entities/content-doc";
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryCategory } from "@/shared/lib/glossary";

// 용어가 쓰이는 컴포넌트의 이름은 컴포넌트 문서(content)의 제목을 쓴다.
const COMPONENT_TITLES = new Map(
  menuDocs("design-system/components").map((doc) => [doc.slug, doc.meta.title ?? doc.slug]),
);

export const Route = createFileRoute("/design-system/glossary/")({
  component: DesignSystemGlossaryPage,
});

const ENTRIES = Object.entries(GLOSSARY)
  .map(([id, entry]) => ({ id, ...entry }))
  .sort((a, b) => (a.korean ?? a.term).localeCompare(b.korean ?? b.term, "ko"));

function DesignSystemGlossaryPage() {
  const hash = useLocation({ select: (location) => location.hash });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GlossaryCategory | null>(null);
  const normalized = query.trim().toLowerCase();

  const matches = ENTRIES.filter(
    (entry) =>
      (!category || entry.category === category) &&
      (!normalized ||
        entry.term.toLowerCase().includes(normalized) ||
        entry.korean?.toLowerCase().includes(normalized) ||
        entry.definition.toLowerCase().includes(normalized)),
  );
  const groups = GLOSSARY_CATEGORIES.map((name) => ({
    name,
    entries: matches.filter((entry) => entry.category === name),
  })).filter((group) => group.entries.length > 0);
  const filters = GLOSSARY_CATEGORIES.filter((name) =>
    ENTRIES.some((entry) => entry.category === name),
  );

  return (
    <article className="max-w-3xl space-y-10">
      <header className="border-border space-y-3 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">디자인 시스템 용어집</h1>
        <p className="text-muted-foreground text-lg leading-relaxed break-keep">
          디자인 시스템과 UI 문서에서 자주 만나는 용어의 한국어 풀이입니다.
        </p>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <SystemIcon
            name="search"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="한글, 영어, 설명으로 검색"
            aria-label="디자인 시스템 용어 검색"
            className="bg-card h-11 rounded-xl pl-10"
          />
        </div>
        <div role="group" aria-label="분류 선택" className="flex flex-wrap gap-1.5">
          {[null, ...filters].map((name) => (
            <Button
              key={name ?? "all"}
              type="button"
              size="sm"
              shape="pill"
              variant={category === name ? "default" : "outline"}
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className="h-7 px-3 text-xs"
            >
              {name ?? "전체"}
            </Button>
          ))}
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.name} className="space-y-3">
              <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight">
                {group.name}
                <span className="text-muted-foreground text-xs font-medium tabular-nums">
                  {group.entries.length}
                </span>
              </h2>
              <dl className="border-border bg-card divide-border divide-y overflow-hidden rounded-2xl border">
                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    id={entry.id}
                    className={`grid scroll-mt-24 gap-2 px-5 py-4 transition-colors md:grid-cols-[12rem_1fr] md:gap-6 ${
                      entry.id === hash ? "bg-accent/60" : ""
                    }`}
                  >
                    <dt className="space-y-0.5">
                      <span className="text-foreground block text-sm font-semibold break-keep">
                        {entry.korean ?? entry.term}
                      </span>
                      {entry.korean && (
                        <span className="text-muted-foreground block text-xs">{entry.term}</span>
                      )}
                    </dt>
                    <dd className="space-y-2">
                      <p className="text-muted-foreground text-sm leading-relaxed break-keep">
                        {entry.definition}
                      </p>
                      {entry.components && (
                        <p className="flex flex-wrap gap-1.5">
                          {entry.components.map((slug) => (
                            <Link
                              key={slug}
                              to="/design-system/components/$slug"
                              params={{ slug }}
                              className="border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium transition-colors"
                            >
                              {COMPONENT_TITLES.get(slug) ?? slug}
                            </Link>
                          ))}
                        </p>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      ) : (
        <p className="border-border text-muted-foreground rounded-2xl border border-dashed p-10 text-center text-sm">
          &ldquo;{query}&rdquo;에 해당하는 용어가 없습니다.
        </p>
      )}
    </article>
  );
}
