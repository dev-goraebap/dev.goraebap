import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, type ButtonProps } from "@goraebap/ui/components/button";
import { CopyCommand } from "@/components/copy-command";

export const Route = createFileRoute("/ui")({
  component: UiShowcasePage,
});

const buttonVariants: Array<NonNullable<ButtonProps["variant"]>> = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
];

const buttonSizes: Array<NonNullable<ButtonProps["size"]>> = ["sm", "default", "lg"];

const buttonCodeSample = `import { Button } from "@goraebap/ui/components/button";

export function Example() {
  return (
    <div className="flex items-center gap-2">
      <Button>저장</Button>
      <Button variant="outline">미리보기</Button>
      <Button variant="ghost">취소</Button>
    </div>
  );
}`;

function UiShowcasePage() {
  const [variant, setVariant] = useState<NonNullable<ButtonProps["variant"]>>("default");
  const [size, setSize] = useState<NonNullable<ButtonProps["size"]>>("default");
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="space-y-12">
      <section className="max-w-2xl space-y-3">
        <p className="text-blog-accent font-mono text-xs">@GORAEBAP/UI · SHADCN REGISTRY</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">UI & 템플릿</h1>
        <p className="text-muted-foreground text-[15px] leading-7">
          모노레포 안의{" "}
          <code className="bg-secondary text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
            packages/ui
          </code>
          를 그대로 렌더링합니다. 여기서 확인한 컴포넌트는 정적 레지스트리 JSON으로 빌드되어 다른
          프로젝트에서도 CLI로 설치할 수 있습니다.
        </p>
      </section>

      {/* Showcase Item 1: Interactive Button */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Button</h2>
            <p className="text-muted-foreground text-xs">
              Base UI 버튼 프리미티브 위에 variant·size 계약을 얹은 기본 컴포넌트
            </p>
          </div>
          <div className="border-border bg-secondary/60 inline-flex rounded-md border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={
                tab === "preview"
                  ? "bg-background text-foreground cursor-pointer rounded px-2.5 py-1 font-medium shadow-xs"
                  : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2.5 py-1"
              }
            >
              미리보기
            </button>
            <button
              type="button"
              onClick={() => setTab("code")}
              className={
                tab === "code"
                  ? "bg-background text-foreground cursor-pointer rounded px-2.5 py-1 font-medium shadow-xs"
                  : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2.5 py-1"
              }
            >
              코드
            </button>
          </div>
        </div>

        {tab === "preview" ? (
          <div className="border-border bg-card overflow-hidden rounded-lg border">
            <div className="bg-dots flex min-h-44 flex-col items-center justify-center gap-4 p-8">
              <Button variant={variant} size={size} onClick={() => setClickCount((c) => c + 1)}>
                Button ({variant})
              </Button>
              <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                clicks: {clickCount}
              </span>
            </div>
            <div className="border-border bg-secondary/30 flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground mr-1 font-mono text-[11px]">variant</span>
                {buttonVariants.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setVariant(item)}
                    className={
                      variant === item
                        ? "bg-primary text-primary-foreground cursor-pointer rounded px-2 py-0.5 font-mono text-[11px]"
                        : "border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px]"
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground mr-1 font-mono text-[11px]">size</span>
                {buttonSizes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSize(item)}
                    className={
                      size === item
                        ? "bg-primary text-primary-foreground cursor-pointer rounded px-2 py-0.5 font-mono text-[11px]"
                        : "border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px]"
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <pre className="border-border bg-secondary/50 text-foreground overflow-x-auto rounded-lg border p-5 font-mono text-xs leading-6">
            <code>{buttonCodeSample}</code>
          </pre>
        )}

        <CopyCommand
          label="CLI"
          command="pnpm dlx shadcn@latest add https://goraebap.xyz/r/button.json"
        />
      </section>

      {/* Showcase Item 2: Registry Install Pattern */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">CopyCommand (블로그 패턴)</h2>
          <p className="text-muted-foreground text-xs">
            레지스트리 설치 명령이나 셸 스니펫을 한 줄로 복사할 수 있는 경량 패턴
          </p>
        </div>
        <div className="bg-dots border-border rounded-lg border p-6">
          <div className="mx-auto max-w-xl">
            <CopyCommand label="$" command="pnpm --filter @goraebap/ui build:registry" />
          </div>
        </div>
      </section>
    </div>
  );
}
