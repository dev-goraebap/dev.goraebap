import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { cn } from 'cn';
import {
  createType, deleteType, editType, orderTypes, refreshBoard, typesOptions, WorkItemTypeIcon, type WorkItemTypeRow,
} from '@/entities/work-item';
import { rowReorderStyles as rows, useRowReorder } from '@/shared/lib/row-reorder';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { Badge } from '@/shared/ui/kit/badge';
import { Button } from '@/shared/ui/kit/button';
import { DEFAULT_MARK_COLOR } from '@/shared/ui/color-palette';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { Field, FieldContent, FieldLabel } from '@/shared/ui/kit/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { GripIcon, PenSquareIcon, PlusIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { Input } from '@/shared/ui/kit/input';
import { MarkPicker } from '@/shared/ui/mark-picker';
import { PageState } from '@/shared/ui/kit/page-state';
import { SettingsPage, SettingsSection } from '@/shared/ui/kit/settings';
import { Switch } from '@/shared/ui/kit/switch';
import { ADMIN_ROW, ADMIN_ROW_NAME } from '@/shared/ui/ordered-row';

type Crumb = { label: string; href?: string; icon?: string };

const NAME_MAX = 32;

/**
 * 프로젝트 관리 › 업무 유형 (BIT's 업무 유형, D-104; 결정기록 2026-11-04 프로젝트 관리): the workspace's work item types,
 * every project's alike, each its mark (an icon in a colour), its name, how many work items keep it, and 기본 on the one
 * a new work item takes when none is named. 유형 추가 and 수정 open the same short dialog; rows move by their grips (or Alt
 * with the arrows), which is the order the menus show. The default type and a type work items keep are not deleted.
 */
export function WorkItemTypesPage({ crumbs }: { crumbs: Crumb[] }) {
  const client = useQueryClient();
  const types = useQuery(typesOptions());
  const [editing, setEditing] = useState<WorkItemTypeRow | 'new' | null>(null);
  const [deleting, setDeleting] = useState<WorkItemTypeRow | null>(null);
  const [failure, setFailure] = useState<string>();
  const save = useMutation({
    mutationFn: ({ type, ...input }: { type?: WorkItemTypeRow; name: string; icon: string; color: string; isDefault: boolean }) =>
      (type ? editType(type.code, input) : createType(input)),
    onSuccess: () => setEditing(null), onSettled: () => refreshBoard(client),
  });
  const remove = useMutation({
    mutationFn: (type: WorkItemTypeRow) => deleteType(type.code),
    onSuccess: () => setDeleting(null), onSettled: () => refreshBoard(client),
  });
  const list = types.data ?? [];
  const reorder = useRowReorder(list.map(type => ({ id: type.code, name: type.name })), { word: '유형', object: '유형을', topic: '유형은' }, rows.ghost,
    async codes => { setFailure(undefined); await orderTypes(codes); await refreshBoard(client); },
    error => setFailure(error instanceof Error ? error.message : '순서를 저장하지 못했습니다.'));
  const kitCrumbs = pageCrumbs(crumbs);
  if (types.isError) return <SettingsPage crumbs={kitCrumbs} title="업무 유형">
    <PageState kind="error" isCompact title="업무 유형을 불러오지 못했습니다" description={types.error.message} />
  </SettingsPage>;
  const byCode = new Map(list.map(type => [type.code, type]));
  const shown = reorder.order.map(code => byCode.get(code)).filter((type): type is WorkItemTypeRow => !!type);
  const actionsOf = (type: WorkItemTypeRow): MenuAction[] => [
    { label: '수정', icon: PenSquareIcon, onSelect: () => { save.reset(); setEditing(type); } },
    ...(!type.isDefault && type.uses === 0 ? [{ label: '삭제', icon: Trash2Icon, onSelect: () => { remove.reset(); setDeleting(type); } }] : []),
  ];
  return <SettingsPage crumbs={kitCrumbs} title="업무 유형">
    <SettingsSection title={`유형 ${list.length}`}
      action={<Button variant="secondary" size="sm" onClick={() => { save.reset(); setEditing('new'); }}><PlusIcon data-icon="inline-start" />유형 추가</Button>}>
      <div ref={reorder.list} className={rows.list} role="list" aria-label="업무 유형 순서">
        {shown.map(type => <div key={type.code} className={cn(rows.row, ADMIN_ROW)} role="listitem" {...reorder.rowProps(type.code)}>
          <button type="button" className={rows.grip} {...reorder.gripProps({ id: type.code, name: type.name })}><GripIcon /></button>
          <WorkItemTypeIcon type={type.code} />
          <span className="flex min-w-0 items-center gap-2">
            <span className={ADMIN_ROW_NAME}>{type.name}</span>
            {type.isDefault ? <Badge variant="secondary">기본</Badge> : null}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">{type.uses > 0 ? `업무 ${type.uses}` : '쓰는 업무 없음'}</span>
          <ActionMenu size="row" label={`${type.name} 메뉴`} actions={actionsOf(type)} />
        </div>)}
      </div>
    </SettingsSection>
    <p id={reorder.hint} className={rows.spoken}>끌어서 순서를 바꿉니다. 손잡이에서 Alt와 위아래 화살표도 쓸 수 있고, 끄는 동안 Esc는 취소입니다.</p>
    <p className={rows.spoken} role="status" aria-live="polite">{reorder.said}</p>
    {failure ? <p className="text-sm text-destructive" role="alert">{failure}</p> : null}
    {editing ? <TypeDialog type={editing === 'new' ? undefined : editing} isPending={save.isPending} error={save.error}
      onClose={() => setEditing(null)} onSave={input => save.mutate({ type: editing === 'new' ? undefined : editing, ...input })} /> : null}
    <ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }}
      title={`${deleting?.name ?? ''} 유형을 삭제할까요?`} description={remove.error?.message ?? '쓰는 업무가 없는 유형입니다. 삭제하면 유형 메뉴에서 빠집니다.'}
      action={{ label: '삭제', isPending: remove.isPending, onAction: () => { if (deleting) remove.mutate(deleting); } }} />
  </SettingsPage>;
}

/** 유형 추가 · 수정: its mark (an icon in a colour), its name, and whether new work items take it when none is named. */
function TypeDialog({ type, isPending, error, onSave, onClose }: {
  type?: WorkItemTypeRow; isPending: boolean; error: Error | null;
  onSave: (input: { name: string; icon: string; color: string; isDefault: boolean }) => void; onClose: () => void;
}) {
  const nameId = useId();
  const defaultId = useId();
  const [name, setName] = useState(type?.name ?? '');
  const [mark, setMark] = useState({ icon: type?.icon ?? 'checklist', color: type?.color ?? DEFAULT_MARK_COLOR });
  const [isDefault, setDefault] = useState(type?.isDefault ?? false);
  const submit = () => { if (name.trim()) onSave({ name: name.trim(), icon: mark.icon, color: mark.color, isDefault }); };
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={type ? '유형 수정' : '유형 추가'} submitLabel={type ? '저장' : '추가'}
    isSubmitDisabled={!name.trim()} isPending={isPending} onSubmit={submit}>
    <Field>
      <FieldLabel htmlFor={nameId}>이름</FieldLabel>
      <div className="flex items-center gap-2">
        <MarkPicker size="field" label="유형 표식" value={mark}
          onChange={next => setMark({ icon: next.icon ?? 'checklist', color: next.color ?? DEFAULT_MARK_COLOR })} />
        <Input id={nameId} placeholder="예: 리서치" value={name} autoFocus onChange={event => setName(event.target.value.slice(0, NAME_MAX))} />
      </div>
    </Field>
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={defaultId}>기본 유형으로</FieldLabel>
      </FieldContent>
      <Switch id={defaultId} checked={isDefault} disabled={type?.isDefault} onCheckedChange={setDefault} />
    </Field>
    {error ? <p className="text-sm text-destructive" role="alert">{error.message}</p> : null}
  </FormDialog>;
}
