import { Link, createFileRoute } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import { FRONTEND_ENGINEERING_DOCS, DocArticle } from "@/entities/webapp-doc";
import { CodeExampleList, examplesFor } from "@/entities/code-example";
import { PageState } from "@/shared/ui";

export const Route = createFileRoute("/frontend/engineering/$slug/")({
  component: FrontendEngineeringPage,
});

const toLink = (doc?: (typeof FRONTEND_ENGINEERING_DOCS)[number]) =>
  doc ? { title: doc.title, href: `/frontend/engineering/${doc.slug}` } : undefined;

function FrontendEngineeringPage() {
  const { slug } = Route.useParams();
  const index = FRONTEND_ENGINEERING_DOCS.findIndex((doc) => doc.slug === slug);
  const doc = FRONTEND_ENGINEERING_DOCS[index];

  if (!doc) {
    return (
      <PageState
        kind="not-found"
        title="문서를 찾을 수 없습니다"
        action={
          <Link
            to="/frontend/engineering"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Engineering 처음으로 돌아가기
          </Link>
        }
      />
    );
  }

  return (
    <DocArticle
      doc={doc}
      trailing={<CodeExampleList examples={examplesFor(doc.skills)} />}
      prevDoc={toLink(FRONTEND_ENGINEERING_DOCS[index - 1])}
      nextDoc={toLink(FRONTEND_ENGINEERING_DOCS[index + 1])}
    />
  );
}
