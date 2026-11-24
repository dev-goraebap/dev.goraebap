import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { PHASE_TONES, type Playbook } from "../model/playbooks";
import { usedSkills } from "../model/usage";

// cowork 문서 카드처럼 위쪽에 기울어진 종이를 그리고 아래쪽에 단계·요약·조합한 스킬 수를 둔다.
export function PlaybookCard({ playbook, order }: { playbook: Playbook; order?: number }) {
  const skills = usedSkills(playbook);
  return (
    <Link
      to="/playbook/$slug"
      params={{ slug: playbook.slug }}
      style={{ "--tone": PHASE_TONES[playbook.phase] } as CSSProperties}
      className="group bg-card hover:border-foreground/30 relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border shadow-xs transition-colors"
    >
      <div
        aria-hidden
        className="relative grid h-40 place-items-center overflow-hidden bg-[color-mix(in_oklab,var(--tone)_13%,var(--background))] text-[color-mix(in_oklab,var(--tone)_70%,var(--foreground))]"
      >
        <div className="border-background/90 bg-background/85 relative top-6.5 flex h-40 w-[72%] -rotate-4 flex-col gap-2 rounded-t-lg border px-4 pt-5 pb-4 transition-transform duration-300 group-hover:-rotate-2">
          <SystemIcon name={playbook.icon} className="size-7" />
          <p className="line-clamp-2 max-w-[90%] text-[0.7rem] leading-[1.6] font-semibold">
            {playbook.title}
          </p>
          <div className="flex flex-col gap-1.25 *:h-0.5 *:bg-current *:opacity-15 *:last:w-[65%]">
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span className="size-2 rounded-full bg-[var(--tone)]" />
          <span>{order ? `${order}. ${playbook.phase}` : playbook.phase}</span>
        </p>
        <p className="font-semibold">{playbook.title}</p>
        <p className="text-muted-foreground line-clamp-2 text-sm">{playbook.summary}</p>
        <p className="text-muted-foreground mt-auto pt-1 text-xs tabular-nums">
          {playbook.steps.length}단계 · 스킬 {skills.length}개
        </p>
      </div>
    </Link>
  );
}
