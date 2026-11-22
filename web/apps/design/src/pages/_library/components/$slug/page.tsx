import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { badgeVariants } from "@goraebap/design-system/recipes/badge";
import { COMPONENT_DOCS, getComponentDoc } from "@/entities/component-doc";
import { AdapterPreviewStage } from "@/shared/ui";

export const Route = createFileRoute("/_library/components/$slug/")({
  component: ComponentDetailPage,
});

function ComponentDetailPage() {
  const { slug } = Route.useParams();
  const doc = getComponentDoc(slug);

  if (!doc) {
    return (
      <div className="border-border bg-card space-y-3 rounded-2xl border p-8 text-center">
        <h1 className="text-lg font-semibold">컴포넌트를 찾을 수 없습니다</h1>
        <Link to="/components" className="text-sm font-medium underline">
          컴포넌트 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const index = COMPONENT_DOCS.findIndex((item) => item.slug === slug);
  const prev = index > 0 ? COMPONENT_DOCS[index - 1] : undefined;
  const next = index < COMPONENT_DOCS.length - 1 ? COMPONENT_DOCS[index + 1] : undefined;

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">{doc.category}</span>
          <span className={badgeVariants({ variant: "outline" })}>{doc.pureHtmlLevel}</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{doc.name}</h1>
        <p className="text-muted-foreground text-base leading-relaxed">{doc.summary}</p>
        <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 pt-1 font-mono text-xs">
          <span>Recipe: {doc.recipePath}</span>
          <span>React: {doc.primitiveReact}</span>
          <span>Angular: {doc.primitiveAngular}</span>
        </div>
      </header>

      {/* Live Adapter + Viewport + Theme Preview Stage */}
      <AdapterPreviewStage
        slug={doc.slug}
        title={doc.name}
        htmlCode={doc.htmlCode}
        reactCode={doc.reactCode}
        angularCode={doc.angularCode}
        renderHtml={doc.renderHtmlDemo}
        renderReact={doc.renderReactDemo}
      />

      {/* Additional Examples */}
      {doc.examples && doc.examples.length > 0 && (
        <section className="space-y-8">
          <h2 className="text-xl font-semibold tracking-tight">Examples</h2>
          {doc.examples.map((example) => (
            <div key={example.id} className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold tracking-tight">{example.title}</h3>
                {example.description && (
                  <p className="text-muted-foreground text-sm">{example.description}</p>
                )}
              </div>
              <AdapterPreviewStage
                title={`${doc.name} — ${example.title}`}
                htmlCode={example.htmlCode}
                reactCode={example.reactCode}
                angularCode={example.angularCode}
                renderHtml={example.renderHtmlDemo}
                renderReact={example.renderReactDemo}
              />
            </div>
          ))}
        </section>
      )}

      {/* Boundary & Mobile Guidelines */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="border-border bg-card space-y-2 rounded-2xl border p-5">
          <p className="text-muted-foreground font-mono text-[11px] uppercase">
            Pure HTML vs Headless Boundary
          </p>
          <p className="text-foreground text-sm leading-relaxed">{doc.pureHtmlNote}</p>
        </section>

        <section className="border-border bg-card space-y-2 rounded-2xl border p-5">
          <p className="text-muted-foreground font-mono text-[11px] uppercase">
            Mobile (&lt; 64rem · 390px) Guideline
          </p>
          <p className="text-foreground text-sm leading-relaxed">{doc.mobileGuideline}</p>
        </section>
      </div>

      {/* Prev / Next Navigation */}
      <nav
        aria-label="이전/다음 컴포넌트"
        className="border-border flex items-center justify-between border-t pt-6 text-sm"
      >
        {prev ? (
          <Link
            to="/components/$slug"
            params={{ slug: prev.slug }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>{prev.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to="/components/$slug"
            params={{ slug: next.slug }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
          >
            <span>{next.name}</span>
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
