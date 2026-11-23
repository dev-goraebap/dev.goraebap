import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { stripGlossaryMarkup } from "@/shared/lib/glossary";
import type { ComponentGuide } from "../model/guides";
import { AnatomyFigure } from "./AnatomyFigure";
import { GuideText } from "./GuideText";

function GuideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function AnatomySection({ slug, guide }: { slug: string; guide: ComponentGuide }) {
  if (!guide.anatomy) return null;
  return (
    <GuideSection title="구성">
      <div className="border-border bg-card grid overflow-hidden rounded-2xl border md:grid-cols-2">
        <div className="bg-dots bg-background/70 border-border flex min-h-64 items-center justify-center border-b p-6 md:border-r md:border-b-0">
          <AnatomyFigure slug={slug} />
        </div>
        <ol className="divide-border divide-y">
          {guide.anatomy.map((part, index) => (
            <li key={part.name} className="flex gap-3 px-5 py-3">
              <span className="bg-primary text-primary-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                {index + 1}
              </span>
              <span className="min-w-0 space-y-0.5">
                <code className="text-foreground block font-mono text-xs font-medium">
                  {part.name}
                </code>
                <span className="text-muted-foreground block text-xs leading-relaxed break-keep">
                  <GuideText at={`anatomy.${index}`} text={part.role} />
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </GuideSection>
  );
}

export function AccessibilitySection({ guide }: { guide: ComponentGuide }) {
  return (
    <GuideSection title="접근성">
      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <dl className="divide-border divide-y">
          {guide.accessibility.keys.map((item, index) => (
            <div key={item.keys} className="flex items-start gap-4 px-5 py-3">
              <dt className="w-24 shrink-0">
                <kbd className="border-border bg-background text-foreground inline-flex rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium shadow-xs">
                  {item.keys}
                </kbd>
              </dt>
              <dd className="text-muted-foreground text-sm leading-relaxed break-keep">
                <GuideText at={`key.${index}`} text={item.action} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <ul className="list-disc space-y-1.5 pl-5">
        {guide.accessibility.notes.map((note, index) => (
          <li key={note} className="text-muted-foreground text-sm leading-relaxed break-keep">
            <GuideText at={`note.${index}`} text={note} />
          </li>
        ))}
      </ul>
    </GuideSection>
  );
}

export function AdaptiveLinkSection({ link }: { link: { section: string; summary: string } }) {
  return (
    <GuideSection title="적응형 UI">
      <Link
        to="/details/$slug"
        params={{ slug: "adaptive-ui" }}
        hash={link.section}
        className="border-border bg-card hover:border-foreground/30 flex items-center gap-4 rounded-2xl border p-5 transition-colors"
      >
        <span className="bg-info/10 text-info flex size-10 shrink-0 items-center justify-center rounded-xl">
          <SystemIcon name="mobile" className="size-5" />
        </span>
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="text-foreground block text-sm leading-relaxed font-medium break-keep">
            {stripGlossaryMarkup(link.summary)}
          </span>
          <span className="text-muted-foreground block text-xs">
            적응형 UI 가이드에서 자세히 보기
          </span>
        </span>
        <SystemIcon name="arrowRight" className="text-muted-foreground size-4 shrink-0" />
      </Link>
    </GuideSection>
  );
}

export function RelatedSection({
  guide,
  getName,
}: {
  guide: ComponentGuide;
  getName: (slug: string) => string | undefined;
}) {
  return (
    <GuideSection title="관련 컴포넌트">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {guide.related.map((item) => (
          <Link
            key={item.slug}
            to="/components/$slug"
            params={{ slug: item.slug }}
            className="border-border bg-card hover:border-foreground/30 space-y-1 rounded-2xl border p-4 transition-colors"
          >
            <span className="text-foreground flex items-center justify-between text-sm font-semibold">
              {getName(item.slug) ?? item.slug}
              <SystemIcon name="arrowRight" className="text-muted-foreground size-3.5" />
            </span>
            <span className="text-muted-foreground block text-xs leading-relaxed break-keep">
              {stripGlossaryMarkup(item.reason)}
            </span>
          </Link>
        ))}
      </div>
    </GuideSection>
  );
}
