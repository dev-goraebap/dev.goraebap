import { createFileRoute, useCanGoBack, useRouter } from "@tanstack/react-router";
import { DocSearchPanel } from "@/widgets/doc-search/panel";

export const Route = createFileRoute("/search/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();

  function handleBack() {
    if (canGoBack) {
      router.history.back();
    } else {
      void navigate({ to: "/blog" });
    }
  }

  return (
    <DocSearchPanel
      surface="page"
      initialQuery={q}
      onBack={handleBack}
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
  );
}
