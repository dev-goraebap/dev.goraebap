import type { ManageMember, WorkspaceMemberRowData } from '../model/member-row';
import { MemberNameCell } from './MemberNameCell';
import { MemberProjectsCell } from './MemberProjectsCell';

/** 휴대폰 줄: 사진 · 이름, 그 아래 참여 프로젝트. */
export function WorkspaceMemberRow({ row, onOpen, onManage }: { row: WorkspaceMemberRowData; onOpen: () => void; onManage?: ManageMember }) {
  return (
    <li className="relative flex flex-col gap-2 border-b bg-background px-4 py-3">
      <span className="flex min-w-0 items-center gap-2">
        <MemberNameCell person={row.person} onOpen={onOpen} />
      </span>
      {row.projects.length > 0 || onManage ? <span className="pl-8"><MemberProjectsCell row={row} onManage={onManage} /></span> : null}
    </li>
  );
}
