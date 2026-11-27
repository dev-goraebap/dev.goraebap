import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import {
  BackendArticle,
  backendAllDocs,
  backendDocHref,
  findBackendDoc,
} from "@/entities/backend-doc";
import { DocPager, PageState } from "@/shared/ui";

export const Route = createFileRoute("/backend/$section/$slug/")({
  validateSearch: (search: Record<string, unknown>): { stack?: string } => ({
    stack: typeof search.stack === "string" && search.stack.length > 0 ? search.stack : undefined,
  }),
  component: BackendDocPage,
});

function BackendDocPage() {
  const { section, slug } = Route.useParams();
  const { stack } = Route.useSearch();
  const navigate = useNavigate();

  const docs = backendAllDocs();
  const doc = findBackendDoc(section, slug);
  const index = doc ? docs.findIndex((d) => d.section === doc.section && d.slug === doc.slug) : -1;

  if (!doc) {
    return (
      <PageState
        kind="not-found"
        title="문서를 찾을 수 없습니다"
        action={
          <Link to="/backend" className={buttonVariants({ variant: "outline", size: "sm" })}>
            백엔드 처음으로
          </Link>
        }
      />
    );
  }

  const prev = index > 0 ? docs[index - 1] : undefined;
  const next = index >= 0 && index + 1 < docs.length ? docs[index + 1] : undefined;

  return (
    <BackendArticle
      doc={doc}
      activeStack={stack ?? "common"}
      onSelectStack={(nextStack) => {
        void navigate({
          to: "/backend/$section/$slug",
          params: { section: doc.section, slug: doc.slug },
          search: nextStack === "common" ? {} : { stack: nextStack },
          replace: true,
        });
      }}
      trailing={
        <DocPager
          prevDoc={prev ? { title: prev.meta.title ?? prev.slug, href: backendDocHref(prev) } : undefined}
          nextDoc={next ? { title: next.meta.title ?? next.slug, href: backendDocHref(next) } : undefined}
        />
      }
    />
  );
}
