import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui-react/components/badge";
import { getComponentDoc } from "@/entities/component-doc";
import { usePreviewSync } from "@/shared/lib/preview-sync";
import { ThemedPortalScope } from "@/shared/ui";

export const Route = createFileRoute("/preview/components/$slug/")({
  component: ComponentMobilePreviewPage,
});

function ComponentMobilePreviewPage() {
  const { slug } = Route.useParams();
  const doc = getComponentDoc(slug);
  const { adapter, theme } = usePreviewSync();

  if (!doc) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center p-6 text-sm">
        컴포넌트를 찾을 수 없습니다: {slug}
      </div>
    );
  }

  return (
    <ThemedPortalScope theme={theme}>
      <div
        data-ds-theme={theme}
        className="bg-background text-foreground flex min-h-screen flex-col transition-colors"
      >
        {/* Mobile App Top Bar (respects Dynamic Island safe area) */}
        <header className="border-border/80 bg-background/90 sticky top-0 z-10 flex items-center justify-between border-b px-4 pt-13 pb-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-muted-foreground font-mono text-[10px] leading-none">
              goraebap/design
            </p>
            <h1 className="mt-1 truncate text-sm font-semibold tracking-tight">{doc.name}</h1>
          </div>
          <Badge variant="secondary">{adapter === "html" ? "Vanilla HTML/TS" : "React"}</Badge>
        </header>

        {/* Scrollable Mobile Content Area */}
        <main className="flex flex-1 flex-col justify-center px-4 pt-6 pb-12">
          <div className="w-full">
            {adapter === "html"
              ? doc.renderHtmlDemo({ isMobile: true })
              : doc.renderReactDemo({ isMobile: true })}
          </div>
        </main>
      </div>
    </ThemedPortalScope>
  );
}
