import { useState, type ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button, buttonVariants } from "@goraebap/ui-react/components/button";
import { getLayoutDoc, type AppShellVariant } from "@/entities/layout-doc";
import { CopyCodeBlock, ResizableLayoutStage, PageState } from "@/shared/ui";

export const Route = createFileRoute("/frontend/design-system/layouts/$id/")({
  component: LayoutDetailPage,
});

const VIEWS = [
  { id: "preview", label: "Preview" },
  { id: "code", label: "Code" },
] as const;

function Segments<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="border-border bg-card inline-flex shrink-0 items-center gap-0.5 rounded-full border p-0.5"
    >
      {items.map((item) => (
        <Button
          key={item.id}
          type="button"
          size="sm"
          shape="pill"
          variant={value === item.id ? "default" : "ghost"}
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
          className="h-7 px-3.5 text-xs"
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function LayoutBlock({
  name,
  fileName,
  code,
  height,
  defaultWidth,
  controls,
  children,
}: {
  name: string;
  fileName: string;
  code: string;
  height?: number;
  defaultWidth?: number;
  controls?: ReactNode;
  children: ReactNode;
}) {
  const [view, setView] = useState<"preview" | "code">("preview");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>{controls}</div>
        <Segments label={`${name} 보기 전환`} items={VIEWS} value={view} onChange={setView} />
      </div>
      {view === "preview" ? (
        <ResizableLayoutStage
          label={`${name} 미리보기 너비`}
          height={height}
          defaultWidth={defaultWidth}
        >
          {children}
        </ResizableLayoutStage>
      ) : (
        <CopyCodeBlock label={fileName} language="html" code={code} />
      )}
    </div>
  );
}

function LayoutDetailPage() {
  const { id } = Route.useParams();
  const layout = getLayoutDoc(id);
  const [variant, setVariant] = useState<AppShellVariant>("inset");

  if (!layout) {
    return (
      <PageState
        kind="not-found"
        title="레이아웃을 찾을 수 없습니다"
        action={
          <Link
            to="/frontend/design-system/layouts"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            레이아웃 목록으로 돌아가기
          </Link>
        }
      />
    );
  }

  return (
    <article className="space-y-10">
      <div className="space-y-6">
        <header className="min-w-0 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{layout.name}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">{layout.summary}</p>
        </header>

        <LayoutBlock
          key={layout.id}
          name={layout.name}
          fileName={`${layout.id}.html`}
          code={layout.getCode(variant)}
          controls={
            layout.variants && (
              <Segments
                label="셸 배치"
                items={layout.variants}
                value={variant}
                onChange={setVariant}
              />
            )
          }
        >
          {layout.renderPreview(variant)}
        </LayoutBlock>
      </div>

      {layout.examples && (
        <section className="space-y-10">
          <h2 className="border-border border-t pt-10 text-2xl font-semibold tracking-tight">
            구성 예제
          </h2>
          {layout.examples.map((example) => (
            <div key={example.id} className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight">{example.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {example.description}
                </p>
                {example.relatedLayoutId && (
                  <Link
                    to="/frontend/design-system/layouts/$id"
                    params={{ id: example.relatedLayoutId }}
                    className="text-foreground inline-flex text-xs font-medium underline underline-offset-4"
                  >
                    {getLayoutDoc(example.relatedLayoutId)?.name} 자세히 보기
                  </Link>
                )}
              </div>
              <LayoutBlock
                name={example.title}
                fileName={`${layout.id}-${example.id}.html`}
                code={example.getCode(variant)}
                height={420}
                defaultWidth={example.defaultWidth}
              >
                {example.renderPreview(variant)}
              </LayoutBlock>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
