import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@goraebap/ui/components/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">dev.goraebap</h1>
        <p className="text-sm text-muted-foreground">
          개발 가치관, 기술 기록, 그리고 @goraebap/ui 디자인 시스템 공간입니다.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button render={<Link to="/ui" />}>UI 쇼케이스 보기</Button>
      </div>
    </section>
  );
}
