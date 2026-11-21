import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui/components/badge";
import { Button } from "@goraebap/ui/components/button";
import { CopyCommand } from "@/components/copy-command";
import { getComponentDoc } from "@/components/ui-docs/component-catalog";
import { PreviewStage } from "@/components/ui-docs/preview-stage";

export const Route = createFileRoute("/ui/components/$slug")({
  component: ComponentDocPage,
});

function ComponentDocPage() {
  const { slug } = Route.useParams();
  const doc = getComponentDoc(slug);

  if (!doc) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">컴포넌트를 찾을 수 없습니다.</h1>
        <Button render={<Link to="/ui" />} nativeButton={false} variant="outline" size="sm">
          ← 디자인 시스템 개요
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">LAYER 04 · UI COMPONENT</Badge>
          <Badge variant="muted">{doc.group}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{doc.name}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">{doc.summary}</p>
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
          <span>Primitive: {doc.primitive}</span>
          <span>Recipe: {doc.recipePath}</span>
        </div>
      </header>

      <PreviewStage title={doc.name} code={doc.code} mobileNote={doc.mobileGuideline}>
        {({ isMobile }) => doc.renderDemo({ isMobile })}
      </PreviewStage>

      <section className="border-border bg-card space-y-2 rounded-xl border p-5">
        <h2 className="text-xs font-semibold">모바일(390px) 설계 기준</h2>
        <p className="text-muted-foreground text-xs leading-relaxed">{doc.mobileGuideline}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold">설치 (shadcn 커스텀 레지스트리)</h2>
        <CopyCommand
          label="CLI"
          command={`pnpm dlx shadcn@latest add https://goraebap.xyz/r/${doc.slug}.json`}
        />
      </section>
    </div>
  );
}
