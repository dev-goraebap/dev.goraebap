import { Fragment } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui-react/components/badge";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { getPlaybookDoc } from "@/entities/playbook-doc";
import { MermaidDiagram, PageState } from "@/shared/ui";

export const Route = createFileRoute("/playbook/$slug/")({
  component: PlaybookDocPage,
});

function PlaybookDocPage() {
  const { slug } = Route.useParams();
  const doc = getPlaybookDoc(slug);

  if (!doc) {
    return (
      <PageState
        kind="not-found"
        title="문서를 찾을 수 없습니다"
        action={
          <Link
            to="/playbook/$slug"
            params={{ slug: "overview" }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Playbook 개요로 돌아가기
          </Link>
        }
      />
    );
  }

  const sections = doc.sections?.filter((section) => section.paragraphs.length > 0) ?? [];
  const isWritten = sections.length > 0;

  return (
    <article className="max-w-3xl space-y-8">
      <header className="border-border space-y-3 border-b pb-8">
        <p className="text-muted-foreground text-sm font-medium">{doc.group}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
          {!isWritten && <Badge variant="secondary">작성 중</Badge>}
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">{doc.summary}</p>
      </header>

      {isWritten ? (
        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
              {section.title && (
                <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              )}
              {section.paragraphs.map((paragraph, index) => (
                <Fragment key={paragraph}>
                  <p className="text-foreground/90 text-base leading-7">{paragraph}</p>
                  {section.diagram?.after === index && (
                    <MermaidDiagram code={section.diagram.code} caption={section.diagram.caption} />
                  )}
                </Fragment>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">다룰 내용</h2>
          <ul className="border-border divide-border divide-y rounded-lg border">
            {doc.topics.map((topic) => (
              <li key={topic} className="px-4 py-3 text-base">
                {topic}
              </li>
            ))}
          </ul>
        </section>
      )}

      {doc.next &&
        (doc.next.to ? (
          <Link to={doc.next.to} className={buttonVariants({ variant: "outline" })}>
            {doc.next.label}
            <SystemIcon name="arrowRight" className="size-4" />
          </Link>
        ) : (
          <p className="text-muted-foreground text-sm">{doc.next.label}</p>
        ))}
    </article>
  );
}
