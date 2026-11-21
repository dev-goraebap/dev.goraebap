import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@goraebap/ui/components/button";

export const Route = createFileRoute("/ui")({
  component: UiShowcasePage,
});

function UiShowcasePage() {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">@goraebap/ui</h1>
        <p className="text-sm text-muted-foreground">
          Base UI + Tailwind CSS v4 기반 컴포넌트 및 shadcn 커스텀 레지스트리.
        </p>
      </div>
      <div className="space-y-3 rounded-lg border border-border p-6">
        <h2 className="text-sm font-medium">Button</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>
    </section>
  );
}
