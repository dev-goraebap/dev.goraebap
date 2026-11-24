import { Link, createFileRoute } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import { DocArticle, WEBAPP_DOCS, getWebappDoc } from "@/entities/webapp-doc";
import { PageState } from "@/shared/ui";

export const Route = createFileRoute("/webapp/$slug/")({
  component: WebappDocPage,
});

const toLink = (doc?: (typeof WEBAPP_DOCS)[number]) =>
  doc ? { title: doc.title, href: `/webapp/${doc.slug}` } : undefined;

function WebappDocPage() {
  const { slug } = Route.useParams();
  const doc = getWebappDoc(slug);

  if (!doc) {
    return (
      <PageState
        kind="not-found"
        title="문서를 찾을 수 없습니다"
        action={
          <Link to="/webapp" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Webapp 처음으로 돌아가기
          </Link>
        }
      />
    );
  }

  const index = WEBAPP_DOCS.findIndex((item) => item.slug === doc.slug);
  return (
    <DocArticle
      doc={doc}
      prevDoc={toLink(WEBAPP_DOCS[index - 1])}
      nextDoc={toLink(WEBAPP_DOCS[index + 1])}
    />
  );
}
