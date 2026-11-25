import { PROJECT_ROLE_LABEL } from '@/entities/project';
import { Button } from '@goraebap/ui-react/compact/button';
import { SettingsIcon } from '@/shared/ui/kit/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@goraebap/ui-react/compact/tooltip';
import type { ManageMember, WorkspaceMemberRowData } from '../model/member-row';
import { MemberProjectChip } from './MemberProjectChip';

/** 한 칸에 그리는 프로젝트 수. 넘치면 +n으로 줄이고, 가리키면 전부 보인다. */
const SHOWN = 3;

/** 참여한 프로젝트들(Linear 멤버 표의 Teams): 앞의 셋과 +n, 관리할 수 있으면 끝에 참여 관리(톱니). */
export function MemberProjectsCell({ row, onManage }: { row: WorkspaceMemberRowData; onManage?: ManageMember }) {
  const rest = row.projects.slice(SHOWN);
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {row.projects.length === 0 ? <span className="text-muted-foreground">-</span> : null}
      {row.projects.slice(0, SHOWN).map(joined => <MemberProjectChip key={joined.project.id} joined={joined} />)}
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger render={<span tabIndex={0} className="relative z-1 flex h-6 shrink-0 items-center rounded-md bg-muted px-2 text-xs text-muted-foreground">+{rest.length}</span>} />
          <TooltipContent>{rest.map(joined => `${joined.project.name} ${PROJECT_ROLE_LABEL[joined.role]}`).join(', ')}</TooltipContent>
        </Tooltip>
      )}
      {onManage ? (
        <Button variant="ghost" size="icon-sm" aria-label={`${row.person.name}의 프로젝트 참여 관리`} title="프로젝트 참여 · 역할 관리"
          className="relative z-1 shrink-0 text-icon-muted max-md:size-11" onClick={() => onManage(row.person)}>
          <SettingsIcon />
        </Button>
      ) : null}
    </span>
  );
}
