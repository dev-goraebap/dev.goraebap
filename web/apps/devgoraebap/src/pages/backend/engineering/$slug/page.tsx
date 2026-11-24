import { Link, createFileRoute } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import { BACKEND_ENGINEERING_DOCS, DocArticle } from "@/entities/webapp-doc";
import { PageState } from "@/shared/ui";

export const Route = createFileRoute("/backend/engineering/$slug/")({
  component: BackendEngineeringPage,
});

const toLink = (doc?: (typeof BACKEND_ENGINEERING_DOCS)[number]) =>
  doc ? { title: doc.title, href: `/backend/engineering/${doc.slug}` } : undefined;

function BackendEngineeringPage() {
  const { slug } = Route.useParams();
  const index = BACKEND_ENGINEERING_DOCS.findIndex((doc) => doc.slug === slug);
  const doc = BACKEND_ENGINEERING_DOCS[index];

  if (!doc) {
    return (
      <PageState
        kind="not-found"
        title="문서를 찾을 수 없습니다"
        action={
          <Link to="/backend" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Backend 처음으로 돌아가기
          </Link>
        }
      />
    );
  }

  return (
    <DocArticle
      doc={doc}
      prevDoc={toLink(BACKEND_ENGINEERING_DOCS[index - 1])}
      nextDoc={toLink(BACKEND_ENGINEERING_DOCS[index + 1])}
    />
  );
}
