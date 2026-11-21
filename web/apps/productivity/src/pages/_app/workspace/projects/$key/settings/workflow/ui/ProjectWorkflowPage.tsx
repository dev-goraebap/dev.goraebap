import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type ReactNode } from 'react';
import { cn } from 'cn';
import { projectOptions } from '@/entities/project';
import {
  CATEGORIES, categoryMark, columnsOptions, createColumn, deleteColumn, editColumn, orderColumns, refreshBoard, WorkItemStatusIcon,
  type BoardColumn, type ColumnCategory,
} from '@/entities/work-item';
import { rowReorderStyles as rows, useRowReorder } from '@/shared/lib/row-reorder';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { Field, FieldLabel } from '@/shared/ui/kit/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { CheckIcon, GripIcon, PenSquareIcon, PlusIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { PageState } from '@/shared/ui/kit/page-state';
import { SettingsPage, SettingsSection } from '@/shared/ui/kit/settings';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { TextField } from '@/shared/ui/settings';

type Crumb = { label: string; href?: string; icon?: string };

const NAME_MAX = 32;

/**
 * A project's 설정 · 워크플로, for Workspace administrators (client/'s BoardColumnsSection · LabelsSection, BIT's board
 * settings): the statuses its work items move through (its board's columns, each counted as one of the five categories),
 * carried into their order by their grips (useRowReorder). Each is added, changed and deleted here (the labels are the
 * workspace's, in 프로젝트 관리 › 라벨); a status still holding work items, or the last one, is not deleted (the server says why). Read only
 * while the project is archived or deleted.
 */
export function ProjectWorkflowPage({ crumbs, projectKey }: { crumbs: Crumb[]; projectKey: string }) {
  const project = useQuery(projectOptions(projectKey));
  const columns = useQuery(columnsOptions(projectKey));
  const failure = project.error ?? columns.error;
  const page = { crumbs: pageCrumbs(crumbs), title: '워크플로' };
  if (failure) return <SettingsPage {...page}>
    <PageState kind="error" isCompact title="워크플로를 불러오지 못했습니다" description={failure.message} />
  </SettingsPage>;
  if (!project.data || !columns.data) return <SettingsPage {...page}>{null}</SettingsPage>;
  const canChange = project.data.can.manage && !project.data.archivedAt;
  return <SettingsPage {...page}
    description={canChange ? undefined : '보관하거나 삭제한 프로젝트라 읽기만 할 수 있습니다.'}>
    <Statuses projectKey={projectKey} columns={columns.data} canChange={canChange} />
  </SettingsPage>;
}

/** 상태 한 줄의 칸: 손잡이(옮길 수 있을 때) · 분류 표식 · 이름 · 분류 · 메뉴. 휴대폰은 손잡이와 메뉴가 44px. */
const ROW = 'grid min-h-11 items-center gap-x-3 border-border px-2';
const MOVABLE = 'grid-cols-[1.25rem_1rem_minmax(0,1fr)_auto_2rem] max-md:grid-cols-[2.75rem_1rem_minmax(0,1fr)_auto_2.75rem]';
const STILL = 'grid-cols-[1rem_minmax(0,1fr)_auto] px-3';

function StatusCells({ column }: { column: BoardColumn }) {
  return <>
    <WorkItemStatusIcon category={column.category} />
    <span className="truncate">{column.name}</span>
    <span className="truncate text-sm text-muted-foreground">{categoryMark(column.category).label}</span>
  </>;
}

/** The statuses in the board's order, a grip on each to carry it, its menu to change or delete it. */
function Statuses({ projectKey, columns, canChange }: { projectKey: string; columns: BoardColumn[]; canChange: boolean }) {
  const client = useQueryClient();
  const [editing, setEditing] = useState<BoardColumn | 'new' | null>(null);
  const [deleting, setDeleting] = useState<BoardColumn | null>(null);
  const [failure, setFailure] = useState<string>();
  const save = useMutation({
    mutationFn: ({ column, name, category }: { column?: BoardColumn; name: string; category: ColumnCategory }) => (column
      ? editColumn(projectKey, column.id, { name, category }) : createColumn(projectKey, { name, category })),
    onSuccess: () => setEditing(null), onSettled: () => refreshBoard(client),
  });
  const remove = useMutation({
    mutationFn: (column: BoardColumn) => deleteColumn(projectKey, column.id),
    onSuccess: () => setDeleting(null), onSettled: () => refreshBoard(client),
  });
  const reorder = useRowReorder(columns.map(column => ({ id: column.id, name: column.name })), { word: '상태', object: '상태를', topic: '상태는' }, rows.ghost,
    async ids => { setFailure(undefined); await orderColumns(projectKey, ids); await refreshBoard(client); },
    error => setFailure(error instanceof Error ? error.message : '순서를 저장하지 못했습니다.'));
  const byId = new Map(columns.map(column => [column.id, column]));
  const shown = (canChange ? reorder.order : columns.map(column => column.id)).map(id => byId.get(id)).filter((column): column is BoardColumn => !!column);
  const actionsOf = (column: BoardColumn): MenuAction[] => [
    { label: '수정', icon: PenSquareIcon, onSelect: () => { save.reset(); setEditing(column); } },
    { label: '삭제', icon: Trash2Icon, onSelect: () => { remove.reset(); setDeleting(column); } },
  ];
  let list: ReactNode;
  if (canChange) list = <div ref={reorder.list} className={rows.list} role="list" aria-label="상태 순서">
    {shown.map(column => <div key={column.id} className={cn(rows.row, ROW, MOVABLE)} role="listitem" {...reorder.rowProps(column.id)}>
      <button type="button" className={rows.grip} {...reorder.gripProps({ id: column.id, name: column.name })}><GripIcon /></button>
      <StatusCells column={column} />
      <ActionMenu size="row" label={`${column.name} 메뉴`} title={column.name} actions={actionsOf(column)} />
    </div>)}
  </div>;
  else list = <div role="list" aria-label="상태" className="flex flex-col divide-y divide-border">
    {shown.map(column => <div key={column.id} className={cn(ROW, STILL)} role="listitem"><StatusCells column={column} /></div>)}
  </div>;
  return <>
    <SettingsSection title="상태"
      action={canChange ? <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => { save.reset(); setEditing('new'); }}>
        <PlusIcon data-icon="inline-start" />상태 추가
      </Button> : undefined}>
      {list}
    </SettingsSection>
    <p id={reorder.hint} className={rows.spoken}>끌어서 순서를 바꿉니다. 손잡이에서 Alt와 위아래 화살표도 쓸 수 있고, 끄는 동안 Esc는 취소입니다.</p>
    <p className={rows.spoken} role="status" aria-live="polite">{reorder.said}</p>
    {failure ? <p role="alert" className="text-sm text-destructive">{failure}</p> : null}
    {editing ? <ColumnDialog column={editing === 'new' ? undefined : editing} isPending={save.isPending} error={save.error}
      onClose={() => setEditing(null)} onSave={(name, category) => save.mutate({ column: editing === 'new' ? undefined : editing, name, category })} /> : null}
    <ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }}
      title={`${deleting?.name ?? ''} 상태를 삭제할까요?`}
      description={remove.error?.message ?? '이 상태에 업무가 남아 있거나 마지막 상태이면 삭제하지 않습니다. 업무를 다른 상태로 먼저 옮겨 주세요.'}
      action={{ label: '삭제', isPending: remove.isPending, onAction: () => { if (deleting) remove.mutate(deleting); } }} />
  </>;
}

/** 상태 추가 · 수정: its name and the category it counts as. 분류는 다섯 개뿐이라 펼쳐 두고 고른다(휴대폰 시트 안에서 또 뜨는 것을 만들지 않는다). */
function ColumnDialog({ column, isPending, error, onSave, onClose }: {
  column?: BoardColumn; isPending: boolean; error: Error | null; onSave: (name: string, category: ColumnCategory) => void; onClose: () => void;
}) {
  const categoryId = useId();
  const [name, setName] = useState(column?.name ?? '');
  const [category, setCategory] = useState<ColumnCategory>(column?.category ?? 'STARTED');
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={column ? '상태 수정' : '상태 추가'}
 submitLabel={column ? '저장' : '추가'}
    isSubmitDisabled={!name.trim()} isPending={isPending} onSubmit={() => onSave(name.trim(), category)}>
    <TextField label="이름" placeholder="예: 검토 중" value={name} autoFocus onChange={value => setName(value.slice(0, NAME_MAX))} />
    <Field>
      <FieldLabel id={categoryId}>분류</FieldLabel>
      <div role="radiogroup" aria-labelledby={categoryId} className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border">
        {CATEGORIES.map(each => <button key={each.value} type="button" role="radio" aria-checked={each.value === category} onClick={() => setCategory(each.value)}
          className="flex h-9 items-center gap-2 px-3 text-left text-sm outline-none hover:bg-row-hover focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset aria-checked:bg-muted max-md:h-12 max-md:text-base">
          <WorkItemStatusIcon category={each.value} />
          <span className="flex-1">{each.label}</span>
          {each.value === category ? <CheckIcon className="size-4" /> : null}
        </button>)}
      </div>
    </Field>
    {error ? <p role="alert" className="text-sm text-destructive">{error.message}</p> : null}
  </FormDialog>;
}
