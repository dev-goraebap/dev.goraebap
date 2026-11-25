import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableText } from '@goraebap/ui-react/compact/table';
import type { ManageMember, WorkspaceMemberRowData } from '../model/member-row';
import { MemberNameCell } from './MemberNameCell';
import { MemberProjectsCell } from './MemberProjectsCell';

const dash = (value?: string | null) => value || <span className="text-muted-foreground">-</span>;

/** 데스크톱 표(Linear의 Members 표): 이름 · 이메일 · 참여 프로젝트. */
export function WorkspaceMembersTable({ rows, onOpen, onManage }: { rows: WorkspaceMemberRowData[]; onOpen: (id: string) => void; onManage?: ManageMember }) {
  return (
    <Table aria-label="멤버" className="bg-background">
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead className="w-56">이메일</TableHead>
          <TableHead>참여 프로젝트</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.person.id} className="group/row relative bg-background hover:bg-row-hover">
            <TableCell><MemberNameCell person={row.person} onOpen={() => onOpen(row.person.id)} /></TableCell>
            <TableCell className="text-muted-foreground"><TableText className="max-w-56">{dash(row.person.workEmail)}</TableText></TableCell>
            <TableCell><MemberProjectsCell row={row} onManage={onManage} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
