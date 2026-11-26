import { Link, createFileRoute } from "@tanstack/react-router";
import { LAYOUT_DOCS, LAYOUT_LEVELS, LAYOUT_PAGES } from "@/entities/layout-doc";

export const Route = createFileRoute("/design-system/layouts/")({
  component: LayoutsOverviewPage,
});

function LayoutsOverviewPage() {
  return (
    <div className="space-y-10">
      <header className="border-border border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">레이아웃</h1>
      </header>

      {LAYOUT_LEVELS.map((level) => {
        const items = LAYOUT_DOCS.filter((item) => item.level === level.id);
        if (items.length === 0) return null;
        return (
          <section key={level.id} className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">{level.title}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  to="/design-system/$slug"
                  params={{ slug: LAYOUT_PAGES[item.id]?.slug ?? item.id }}
                  hash={LAYOUT_PAGES[item.id]?.hash}
                  className="group min-w-0 space-y-2.5"
                >
                  <div className="border-border bg-card group-hover:border-foreground/35 flex h-44 items-center justify-center overflow-hidden rounded-2xl border p-4 transition-colors">
                    {item.renderThumbnail()}
                  </div>
                  <p className="text-foreground px-1 text-sm font-medium">{item.name}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
