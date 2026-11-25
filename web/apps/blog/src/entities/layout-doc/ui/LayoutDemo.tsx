import { useState, type ReactNode } from "react";
import { Button } from "@goraebap/ui-react/components/button";
import { CopyCodeBlock, ResizableLayoutStage } from "@/shared/ui";
import { getLayoutDoc } from "../model/catalog";
import type { AppShellVariant } from "./LayoutPreviews";

const VIEWS = [
  { id: "preview", label: "미리보기" },
  { id: "code", label: "코드" },
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

/**
 * 레이아웃 견본 하나. 지침 글(content)의 <Demo> 안에서 쓴다.
 * example을 주면 그 레이아웃의 구성 예제를, 없으면 레이아웃 자체를 미리보기와 코드로 보인다.
 */
export function LayoutDemo({ id, example }: { id: string; example?: string }) {
  const layout = getLayoutDoc(id);
  const [variant, setVariant] = useState<AppShellVariant>("inset");
  if (!layout) return null;
  const item = example ? layout.examples?.find((each) => each.id === example) : undefined;
  if (example && !item) return null;
  const controls = layout.variants && (
    <Segments label="셸 배치" items={layout.variants} value={variant} onChange={setVariant} />
  );

  if (item) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-tight">{item.title}</p>
        <LayoutBlock
          name={item.title}
          fileName={`${layout.id}-${item.id}.html`}
          code={item.getCode(variant)}
          height={420}
          defaultWidth={item.defaultWidth}
          controls={controls}
        >
          {item.renderPreview(variant)}
        </LayoutBlock>
      </div>
    );
  }
  return (
    <LayoutBlock
      name={layout.name}
      fileName={`${layout.id}.html`}
      code={layout.getCode(variant)}
      controls={controls}
    >
      {layout.renderPreview(variant)}
    </LayoutBlock>
  );
}
