import { Link, createFileRoute } from "@tanstack/react-router";
import { COMPONENT_CATEGORIES, COMPONENT_DOCS } from "@/entities/component-doc";

export const Route = createFileRoute("/_library/components/")({
  component: ComponentsOverviewPage,
});

function ComponentsOverviewPage() {
  return (
    <div className="space-y-12">
      {/* Centered Astryx-style Header */}
      <header className="border-border space-y-4 border-b pb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">컴포넌트</h1>
      </header>

      {/* Categorized 3-column Live Miniature Preview Grid */}
      <div className="space-y-12">
        {COMPONENT_CATEGORIES.map((category) => {
          const items = COMPONENT_DOCS.filter((doc) => doc.category === category);
          return (
            <section key={category} className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold tracking-tight">{category}</h2>
                <span className="text-muted-foreground font-mono text-xs">{items.length}</span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    to="/components/$slug"
                    params={{ slug: item.slug }}
                    className="group space-y-2.5"
                  >
                    <div className="border-border bg-card group-hover:border-foreground/35 flex h-44 items-center justify-center overflow-hidden rounded-2xl border p-4 transition-colors">
                      {item.renderThumbnail()}
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-foreground text-sm font-medium">{item.name}</span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {item.pureHtmlLevel === "100% Native HTML" ? "Pure HTML" : "Headless"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
