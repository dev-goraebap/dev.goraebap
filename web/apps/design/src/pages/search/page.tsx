import { createFileRoute } from "@tanstack/react-router";
import { DocSearchContent } from "@/widgets/doc-search";

export const Route = createFileRoute("/search/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-6 lg:py-12">
      <h1 className="mb-5 text-3xl font-bold tracking-tight">문서 검색</h1>
      <DocSearchContent
        surface="page"
        initialQuery={q}
        onQueryChange={(query) =>
          void navigate({
            search: { q: query.trim() ? query : undefined },
            replace: true,
            resetScroll: false,
            viewTransition: false,
          })
        }
        onOpen={(entry) => void navigate({ to: entry.href, hash: entry.hash })}
      />
    </main>
  );
}
