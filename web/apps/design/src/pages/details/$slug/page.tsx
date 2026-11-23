import { Fragment } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Separator } from "@goraebap/ui-react/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";
import { getDetailDoc } from "@/entities/detail-doc";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/details/$slug/")({
  component: DetailPage,
});

function DetailPage() {
  const { slug } = Route.useParams();
  const detail = getDetailDoc(slug);

  if (!detail) {
    return (
      <div className="border-border bg-card space-y-3 rounded-2xl border p-8 text-center">
        <h1 className="text-lg font-semibold">글을 찾을 수 없습니다</h1>
        <Link to="/details" className="text-sm font-medium underline">
          디테일 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl space-y-8">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">{detail.title}</h1>
        <p className="text-muted-foreground text-base leading-relaxed">{detail.summary}</p>
      </header>

      {detail.sections && detail.sections.length > 0 ? (
        <div>
          {detail.sections.map((section, index) => (
            <Fragment key={section.id}>
              {index > 0 && <Separator variant="wave" className="my-10" />}
              <section id={section.id} className="scroll-mt-24 space-y-5">
                <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                <p className="text-foreground text-sm leading-relaxed">{section.problem}</p>
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
                <p className="text-foreground text-sm leading-relaxed">{section.guidance}</p>
              </section>
            </Fragment>
          ))}
        </div>
      ) : (
        <>
          {detail.problem && (
            <p className="text-foreground text-sm leading-relaxed">{detail.problem}</p>
          )}

          {detail.renderDemo && (
            <div className="bg-dots border-border rounded-2xl border p-4 sm:p-6">
              {detail.renderDemo()}
            </div>
          )}

          {detail.codeTabs && detail.codeTabs.length > 0 ? (
            <Tabs defaultValue={detail.codeTabs[0].id}>
              <TabsList>
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
            <p className="text-foreground text-sm leading-relaxed">{detail.guidance}</p>
          )}
        </>
      )}
    </article>
  );
}
