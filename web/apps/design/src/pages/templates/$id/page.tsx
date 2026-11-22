import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Monitor, Smartphone } from "lucide-react";
import { ReactDialogDemo } from "@/entities/component-doc/ui/InteractiveDemos";
import { AppShellDesktopPreview, getTemplateDoc } from "@/entities/template-doc";
import { MobileDeviceFrame } from "@/shared/ui";

export const Route = createFileRoute("/templates/$id/")({
  component: TemplateDetailPage,
});

const VIEWPORTS = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "mobile", label: "Mobile 390px", icon: Smartphone },
] as const;

function TemplateDetailPage() {
  const { id } = Route.useParams();
  const template = getTemplateDoc(id);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const isMobile = viewport === "mobile";

  if (!template) {
    return (
      <div className="border-border bg-card space-y-3 rounded-2xl border p-8 text-center">
        <h1 className="text-lg font-semibold">템플릿을 찾을 수 없습니다</h1>
        <Link to="/templates" className="text-sm font-medium underline">
          템플릿 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{template.name}</h1>
        <div
          role="group"
          aria-label="미리보기 크기"
          className="border-border bg-card inline-flex shrink-0 items-center rounded-full border p-0.5 text-xs"
        >
          {VIEWPORTS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === viewport;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setViewport(item.id)}
                className={
                  isActive
                    ? "bg-primary text-primary-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium"
                    : "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5"
                }
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div
        className={`bg-dots border-border flex rounded-2xl border ${
          isMobile
            ? "justify-center px-4 py-10 sm:px-8"
            : "justify-center-safe overflow-x-auto p-4 sm:p-6"
        }`}
      >
        {isMobile ? (
          <MobileDeviceFrame
            path={`/preview/templates/${template.id}`}
            title={template.mobileTitle}
          />
        ) : template.id === "app-shell" ? (
          <AppShellDesktopPreview />
        ) : (
          <ReactDialogDemo isMobile={false} />
        )}
      </div>
    </article>
  );
}
