import { cn } from '@/shared/lib/utils';
import { ActionMenu } from '@/shared/ui/action-menu';
import { Button } from '@/shared/ui/button';
import { FileTextIcon, FolderIcon, FolderWithFilesIcon, ImageIcon, PencilIcon, PlusIcon } from '@/shared/ui/icon';
import { PageState } from '@/shared/ui/page-state';
import { RowLink } from '@/shared/ui/row-link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { childrenOf, folderHref, sizeText, type FolderNode } from '../../entities/node';
import type { FolderDnd } from './dnd';

function Mark({ node }: { node: FolderNode }) {
  const Icon = node.kind === 'folder' ? FolderIcon : node.type === 'image' ? ImageIcon : FileTextIcon;
  return <Icon className="shrink-0 text-icon-muted" />;
}
const dateText = (value: string) => `${Number(value.slice(5, 7))}월 ${Number(value.slice(8, 10))}일`;

type Handlers = { onMove: (node: FolderNode) => void; onRename: (node: FolderNode) => void };

/** 행 끝 메뉴(…): 옮기기 · 이름 바꾸기. 줄 링크 위에 떠서 따로 눌린다. 옮기기 아이콘이 키트에 없어 파일 든 폴더 아이콘으로 대신한다. */
function RowMenu({ node, onMove, onRename }: Handlers & { node: FolderNode }) {
  return (
    <span className="relative z-1 flex">
      <ActionMenu label={`${node.name} 메뉴`} title={node.name} size="row" actions={[
        { label: '옮기기', icon: FolderWithFilesIcon, onSelect: () => onMove(node) },
        { label: '이름 바꾸기', icon: PencilIcon, onSelect: () => onRename(node) },
      ]} />
    </span>
  );
}

/** 이름: 폴더는 줄 전체를 여는 링크, 파일은 글자. */
function NameOf({ node }: { node: FolderNode }) {
  return node.kind === 'folder'
    ? <RowLink to={folderHref(node.id) as string} className="truncate font-medium">{node.name}</RowLink>
    : <span className="truncate">{node.name}</span>;
}

/** 줄의 면: 점 무늬를 가리고 가리키면 옅게 덮는다. 끌어 온 항목을 놓을 수 있는 폴더 줄은 강조한다. */
const ROW = 'relative bg-background hover:bg-row-hover data-over:bg-pressed data-over:ring-1 data-over:ring-primary data-over:ring-inset';

/**
 * 한 폴더의 내용. 데스크톱은 표(이름 · 수정일 · 크기, 행 끝 메뉴), 휴대폰은 행 목록이다. 폴더가 먼저, 같은 종류는 이름 순.
 * 행은 끌 수 있고 폴더 행에는 끌어 온 항목을 놓을 수 있다(같은 일은 "옮기기" 메뉴로도 한다). 폴더 행은 어디를 눌러도 열린다.
 * 비어 있으면 상태 화면에서 새 폴더를 권한다.
 */
export function FolderContents({ nodes, folder, isMobile, dnd, onCreate, ...handlers }: Handlers & {
  nodes: FolderNode[]; folder: FolderNode; isMobile: boolean; dnd: FolderDnd; onCreate: () => void;
}) {
  const items = childrenOf(nodes, folder.id);
  if (items.length === 0) return <PageState kind="empty" title="이 폴더는 비어 있습니다" description="다른 폴더에서 항목을 옮겨 오거나 새 폴더를 만들어 보세요."
    action={<Button variant="secondary" onClick={onCreate}><PlusIcon data-icon="inline-start" />새 폴더</Button>} />;
  const detail = (node: FolderNode) => node.kind === 'folder' ? `${childrenOf(nodes, node.id).length}개 항목` : sizeText(node.size);
  const rowProps = (node: FolderNode) => ({ ...dnd.dragProps(node.id), ...(node.kind === 'folder' ? dnd.dropProps(node.id) : {}), 'data-over': dnd.over === node.id || undefined });
  if (isMobile) {
    return (
      <ul aria-label={`${folder.name} 내용`} className="flex flex-col">
        {items.map(node => (
          <li key={node.id} {...rowProps(node)} className={cn(ROW, 'flex min-h-14 items-center gap-3 border-b px-4 py-2')}>
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted"><Mark node={node} /></span>
            <span className="flex min-w-0 flex-1 flex-col">
              <NameOf node={node} />
              <span className="text-sm text-muted-foreground tabular-nums">{detail(node)} · {dateText(node.updatedAt)}</span>
            </span>
            <RowMenu node={node} {...handlers} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <Table aria-label={`${folder.name} 내용`} className="table-fixed bg-background">
      <TableHeader className="sticky top-0 z-2 bg-background">
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-10 pl-4 text-muted-foreground">이름</TableHead>
          <TableHead className="w-28 text-muted-foreground">수정일</TableHead>
          <TableHead className="w-28 text-right text-muted-foreground">크기</TableHead>
          <TableHead className="w-14 pr-4"><span className="sr-only">메뉴</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(node => (
          <TableRow key={node.id} {...rowProps(node)} className={ROW}>
            <TableCell className="h-11 pl-4"><span className="flex min-w-0 items-center gap-2"><Mark node={node} /><NameOf node={node} /></span></TableCell>
            <TableCell className="text-muted-foreground tabular-nums">{dateText(node.updatedAt)}</TableCell>
            <TableCell className="text-right text-muted-foreground tabular-nums">{detail(node)}</TableCell>
            <TableCell className="pr-4"><span className="flex justify-end"><RowMenu node={node} {...handlers} /></span></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
