import { useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@goraebap/ui-react/components/alert";
import { SystemIcon } from "@goraebap/ui-react/icons";
import {
  AccessibilitySection,
  ADAPTIVE_LINKS,
  AdaptiveLinkSection,
  AnatomySection,
  COMPONENT_DOCS,
  COMPONENT_GUIDES,
  GuideText,
  GuideTextProvider,
  RelatedSection,
  collectGuideTexts,
  getComponentDoc,
  useRecipeSource,
} from "@/entities/component-doc";
import { annotateGlossary } from "@/shared/lib/glossary";
import { AdapterPreviewStage } from "@/shared/ui";

export const Route = createFileRoute("/_library/components/$slug/")({
  component: ComponentDetailPage,
});

function ComponentDetailPage() {
  const { slug } = Route.useParams();
  const doc = getComponentDoc(slug);
  const guide = COMPONENT_GUIDES[slug];
  const recipeCode = useRecipeSource(guide ? slug : undefined);
  const guideTexts = useMemo(
    () =>
      doc && guide
        ? annotateGlossary(
            collectGuideTexts(doc, guide),
            new Set(COMPONENT_DOCS.map((item) => item.slug)),
          )
        : {},
    [doc, guide],
  );

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
  const adaptiveLink = ADAPTIVE_LINKS[slug];
  const getName = (target: string) => getComponentDoc(target)?.name;

  return (
    <GuideTextProvider value={guideTexts}>
      <article className="space-y-12">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{doc.name}</h1>
          <p className="text-muted-foreground text-base leading-relaxed break-keep">
            <GuideText at="usage" text={guide?.usage ?? doc.summary} />
          </p>
        </header>

        <AdapterPreviewStage
          reactCode={doc.reactCode}
          recipeCode={recipeCode}
          angularCode={doc.angularCode}
          renderReact={doc.renderReactDemo}
        />

        {guide && <AnatomySection slug={slug} guide={guide} />}

        {doc.examples && doc.examples.length > 0 && (
          <section className="space-y-8">
            <h2 className="text-xl font-semibold tracking-tight">변형</h2>
            {doc.examples.map((example) => (
              <div key={example.id} className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold tracking-tight">{example.title}</h3>
                  {example.description && (
                    <p className="text-muted-foreground text-sm break-keep">
                      <GuideText at={`example.${example.id}`} text={example.description} />
                    </p>
                  )}
                </div>
                <AdapterPreviewStage
                  reactCode={example.reactCode}
                  recipeCode={recipeCode}
                  angularCode={example.angularCode}
                  renderReact={example.renderReactDemo}
                />
              </div>
            ))}
          </section>
        )}

        {guide && <AccessibilitySection guide={guide} />}
        {adaptiveLink ? (
          <AdaptiveLinkSection link={adaptiveLink} />
        ) : (
          !guide && (
            <Alert
              role="note"
              variant="info"
              className="[&>h5]:mb-2 [&>p]:text-sm [&>p]:break-keep"
            >
              <AlertTitle className="flex items-center gap-1.5 text-xs font-semibold">
                <SystemIcon name="mobile" className="size-4" />
                INFO · 모바일
              </AlertTitle>
              <AlertDescription>{doc.mobileGuideline}</AlertDescription>
            </Alert>
          )
        )}
        {guide && <RelatedSection guide={guide} getName={getName} />}

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
              <SystemIcon name="chevronLeft" className="size-4" />
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
              <SystemIcon name="chevronRight" className="size-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </GuideTextProvider>
  );
}
