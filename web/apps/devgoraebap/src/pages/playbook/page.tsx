import { createFileRoute } from "@tanstack/react-router";
import { PLAYBOOKS, PlaybookCard } from "@/entities/playbook";

export const Route = createFileRoute("/playbook/")({
  component: PlaybookOverviewPage,
});

function PlaybookOverviewPage() {
  return (
    <div className="space-y-12">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">플레이북</h1>
        <p className="text-muted-foreground max-w-3xl text-base leading-relaxed break-keep">
          자주 하는 일을 처음부터 끝까지 해내는 절차와, 그 절차마다 꺼내 쓰는 스킬의 조합
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {PLAYBOOKS.map((playbook, index) => (
          <PlaybookCard
            key={playbook.slug}
            playbook={playbook}
            order={playbook.phase === "상시" ? undefined : index + 1}
          />
        ))}
      </div>
    </div>
  );
}
