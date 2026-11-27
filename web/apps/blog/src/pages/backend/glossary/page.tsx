import { useState } from "react";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { Input } from "@goraebap/ui-react/components/input";
import { SystemIcon } from "@goraebap/ui-react/icons";
import {
  BACKEND_GLOSSARY_CATEGORIES,
  BACKEND_GLOSSARY_ENTRIES,
} from "@/entities/backend-doc";

export const Route = createFileRoute("/backend/glossary/")({
  component: BackendGlossaryPage,
});

function BackendGlossaryPage() {
  const hash = useLocation({ select: (location) => location.hash });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const normalized = query.trim().toLowerCase();

  const matches = BACKEND_GLOSSARY_ENTRIES.filter(
    (entry) =>
      (!category || entry.category === category) &&
      (!normalized ||
        entry.korean.toLowerCase().includes(normalized) ||
        entry.term.toLowerCase().includes(normalized) ||
        entry.definition.toLowerCase().includes(normalized) ||
        (entry.distinction?.toLowerCase().includes(normalized) ?? false)),
  );

  const groups = BACKEND_GLOSSARY_CATEGORIES.map((name) => ({
    name,
    entries: matches.filter((entry) => entry.category === name),
  })).filter((group) => group.entries.length > 0);

  return (
    <article className="max-w-3xl space-y-10">
      <header className="border-border space-y-3 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">백엔드 용어집</h1>
        <p className="text-muted-foreground text-lg leading-relaxed break-keep">
          백엔드 플레이북·아티클·레퍼런스 전반에서 같은 개념을 같은 이름으로 부르기 위해 정리한 용어입니다.
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
            aria-label="백엔드 용어 검색"
            className="bg-card h-11 rounded-xl pl-10"
          />
        </div>
        <div role="group" aria-label="분류 선택" className="flex flex-wrap gap-1.5">
          {[null, ...BACKEND_GLOSSARY_CATEGORIES].map((name) => (
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
                    className={`grid scroll-mt-24 gap-3 px-5 py-4 transition-colors md:grid-cols-[12rem_1fr] md:gap-6 ${
                      entry.id === hash ? "bg-accent/60" : ""
                    }`}
                  >
                    <dt className="space-y-0.5">
                      <span className="text-foreground block text-sm font-semibold break-keep">
                        {entry.korean}
                      </span>
                      <span className="text-muted-foreground block text-xs">{entry.term}</span>
                    </dt>
                    <dd className="space-y-2.5">
                      <p className="text-foreground/90 text-sm leading-relaxed break-keep">
                        {entry.definition}
                      </p>
                      {entry.distinction && (
                        <p className="text-muted-foreground text-xs leading-relaxed break-keep">
                          {entry.distinction}
                        </p>
                      )}
                      {entry.stacks && Object.keys(entry.stacks).length > 0 && (
                        <div className="bg-muted/50 space-y-1.5 rounded-xl px-3 py-2.5 text-xs">
                          {Object.entries(entry.stacks).map(([stackName, mapping]) => (
                            <div key={stackName} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="text-foreground font-medium">{stackName}</span>
                              <span className="text-muted-foreground break-keep">{mapping}</span>
                            </div>
                          ))}
                        </div>
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
