import { Link, createFileRoute } from "@tanstack/react-router";
import { TEMPLATE_DOCS } from "@/entities/template-doc";

export const Route = createFileRoute("/templates/")({
  component: TemplatesOverviewPage,
});

function TemplatesOverviewPage() {
  return (
    <div className="space-y-10">
      <header className="border-border border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATE_DOCS.map((item) => (
          <Link
            key={item.id}
            to="/templates/$id"
            params={{ id: item.id }}
            className="group space-y-2.5"
          >
            <div className="border-border bg-card group-hover:border-foreground/35 flex h-44 items-center justify-center overflow-hidden rounded-2xl border p-4 transition-colors">
              {item.renderThumbnail()}
            </div>
            <p className="text-foreground px-1 text-sm font-medium">{item.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
