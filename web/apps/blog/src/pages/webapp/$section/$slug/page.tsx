import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import {
  DiataxisArticle,
  diataxisAllDocs,
  diataxisDocHref,
  diataxisNavGroups,
  findDiataxisDoc,
} from "@/entities/diataxis-doc";
import { DocPager, DocsShell, PageState } from "@/shared/ui";

export const Route = createFileRoute("/webapp/$section/$slug/")({
  validateSearch: (search: Record<string, unknown>): { stack?: string } => ({
    stack: typeof search.stack === "string" && search.stack.length > 0 ? search.stack : undefined,
  }),
  component: WebappDocPage,
});

function WebappDocPage() {
  const { section, slug } = Route.useParams();
  const { stack } = Route.useSearch();
  const navigate = useNavigate();

  const docs = diataxisAllDocs("webapp");
  const doc = findDiataxisDoc("webapp", section, slug);
  const index = doc ? docs.findIndex((d) => d.section === doc.section && d.slug === doc.slug) : -1;

  const content = !doc ? (
    <PageState
      kind="not-found"
      title="문서를 찾을 수 없습니다"
      action={
        <Link to="/webapp" className={buttonVariants({ variant: "outline", size: "sm" })}>
          웹 애플리케이션 홈으로
        </Link>
      }
    />
  ) : (
    <DiataxisArticle
      doc={doc}
      activeStack={stack ?? "common"}
      onSelectStack={(nextStack) => {
        void navigate({
          to: "/webapp/$section/$slug",
          params: { section: doc.section, slug: doc.slug },
          search: nextStack === "common" ? {} : { stack: nextStack },
          replace: true,
          resetScroll: false,
          viewTransition: false,
        });
      }}
      trailing={
        <DocPager
          prevDoc={
            index > 0
              ? {
                  title: docs[index - 1].meta.title ?? docs[index - 1].slug,
                  href: diataxisDocHref(docs[index - 1]),
                }
              : undefined
          }
          nextDoc={
            index >= 0 && index + 1 < docs.length
              ? {
                  title: docs[index + 1].meta.title ?? docs[index + 1].slug,
                  href: diataxisDocHref(docs[index + 1]),
                }
              : undefined
          }
        />
      }
    />
  );

  return (
    <DocsShell label="웹 애플리케이션 홈 탐색" groups={diataxisNavGroups("webapp")}>
      {content}
    </DocsShell>
  );
}
