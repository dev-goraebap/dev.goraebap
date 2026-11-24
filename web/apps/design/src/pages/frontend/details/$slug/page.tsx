import { Fragment } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { Separator } from "@goraebap/ui-react/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";
import { getDetailDoc } from "@/entities/detail-doc";
import { CopyCodeBlock, PageState } from "@/shared/ui";

export const Route = createFileRoute("/frontend/details/$slug/")({
  component: DetailPage,
});

function DetailPage() {
  const { slug } = Route.useParams();
  const detail = getDetailDoc(slug);

  if (!detail) {
    return (
      <PageState
        kind="not-found"
        title="글을 찾을 수 없습니다"
        action={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link to="/frontend/details" />}
          >
            Details 목록으로 돌아가기
          </Button>
        }
      />
    );
  }

  return (
    <article className="max-w-3xl space-y-8">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">{detail.title}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{detail.summary}</p>
      </header>

      {detail.problem && (
        <div className="space-y-8">
          <p className="text-foreground text-base leading-relaxed">{detail.problem}</p>

          {detail.renderDemo && (
            <div className="bg-dots border-border rounded-2xl border p-4 sm:p-6">
              {detail.renderDemo()}
            </div>
          )}

          {detail.codeTabs && detail.codeTabs.length > 0 ? (
            <Tabs defaultValue={detail.codeTabs[0].id}>
              <TabsList className="max-w-full justify-start overflow-x-auto">
                {detail.codeTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {detail.codeTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id}>
                  <CopyCodeBlock label={tab.label} language={tab.language} code={tab.code} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            detail.code && (
              <CopyCodeBlock label={detail.codeLabel ?? "code"} language="css" code={detail.code} />
            )
          )}

          {detail.guidance && (
            <p className="text-foreground text-base leading-relaxed">{detail.guidance}</p>
          )}
        </div>
      )}

      {detail.sections && detail.sections.length > 0 && (
        <div>
          {detail.sections.map((section, index) => (
            <Fragment key={section.id}>
              {(index > 0 || detail.problem) && <Separator variant="wave" className="my-10" />}
              <section id={section.id} className="scroll-mt-24 space-y-5">
                <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                <p className="text-foreground text-base leading-relaxed">{section.problem}</p>
                {section.renderDemo && (
                  <div className="bg-dots border-border rounded-2xl border p-4 sm:p-6">
                    {section.renderDemo()}
                  </div>
                )}
                <CopyCodeBlock
                  label={section.codeLabel}
                  language={section.codeLanguage ?? "css"}
                  code={section.code}
                />
                <p className="text-foreground text-base leading-relaxed">{section.guidance}</p>
              </section>
            </Fragment>
          ))}
        </div>
      )}

      {detail.references && (
        <section className="border-border space-y-4 border-t pt-8">
          <h2 className="text-xl font-semibold tracking-tight">참고 자료</h2>
          <ul className="space-y-3">
            {detail.references.map((reference) => (
              <li key={reference.href} className="text-base leading-relaxed">
                <a
                  href={reference.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-4"
                >
                  {reference.title}
                </a>
                <span className="text-muted-foreground"> · {reference.source}</span>
                <p className="text-muted-foreground mt-0.5">{reference.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
