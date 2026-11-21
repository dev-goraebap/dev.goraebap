import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { cn } from 'cn';
import type { QueryClient } from '@tanstack/react-query';
import {
  createDocumentLabel as createLabel, deleteDocumentLabel as deleteLabel, editDocumentLabel as editLabel, documentLabelsOptions as labelsOptions,
  orderDocumentLabels as orderLabels, type DocumentLabel,
} from '@/entities/document';
import { LabelDot as DocumentLabelDot } from '@/shared/ui/label-dot/LabelDot';
import { rowReorderStyles as rows, useRowReorder } from '@/shared/lib/row-reorder';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { Button } from '@/shared/ui/kit/button';
import { ColorPalette, DEFAULT_MARK_COLOR } from '@/shared/ui/color-palette';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { Field, FieldLabel, FieldTitle } from '@/shared/ui/kit/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { GripIcon, PenSquareIcon, PlusIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { Input } from '@/shared/ui/kit/input';
import { PageState } from '@/shared/ui/kit/page-state';
import { SettingsPage, SettingsSection } from '@/shared/ui/kit/settings';
import { ADMIN_ROW, ADMIN_ROW_NAME } from '@/shared/ui/ordered-row';

type Crumb = { label: string; href?: string; icon?: string };

const NAME_MAX = 200;
const refreshDocumentLabels = (client: QueryClient) => client.invalidateQueries({ queryKey: ['documents'] });

/**
 * 프로젝트 관리 › 라벨 (BIT's 라벨, D-009; 결정기록 2026-11-04 프로젝트 관리): the workspace's labels, shared by every
 * project, each its colour, its name and how many work items wear it. 라벨 추가 and 수정 open the same short dialog (a
 * name not taken, a colour); 삭제 asks first and takes the label off its work items. Rows move by their grips (or Alt with
 * the arrows), which is the order the label menus show.
 */
export function DocumentLabelsPage({ crumbs }: { crumbs: Crumb[] }) {
  const client = useQueryClient();
  const labels = useQuery(labelsOptions());
  const [editing, setEditing] = useState<DocumentLabel | 'new' | null>(null);
  const [deleting, setDeleting] = useState<DocumentLabel | null>(null);
  const [failure, setFailure] = useState<string>();
  const save = useMutation({
    mutationFn: async ({ label, name, color }: { label?: DocumentLabel; name: string; color: string }) =>
      await (label ? editLabel(label, { name, color }) : createLabel({ name, color })),
    onSuccess: () => setEditing(null), onSettled: () => refreshDocumentLabels(client),
  });
  const remove = useMutation({
    mutationFn: (label: DocumentLabel) => deleteLabel(label),
    onSuccess: () => setDeleting(null), onSettled: () => refreshDocumentLabels(client),
  });
  const list = labels.data ?? [];
  const reorder = useRowReorder(list.map(label => ({ id: label.id, name: label.name })), { word: '라벨', object: '라벨을', topic: '라벨은' }, rows.ghost,
    async ids => { setFailure(undefined); await orderLabels(ids); await refreshDocumentLabels(client); },
    error => setFailure(error instanceof Error ? error.message : '순서를 저장하지 못했습니다.'));
  const kitCrumbs = pageCrumbs(crumbs);
  if (labels.isError) return <SettingsPage crumbs={kitCrumbs} title="문서 라벨">
    <PageState kind="error" isCompact title="라벨을 불러오지 못했습니다" description={labels.error.message} />
  </SettingsPage>;
  const byId = new Map(list.map(label => [label.id, label]));
  const shown = reorder.order.map(id => byId.get(id)).filter((label): label is DocumentLabel => !!label);
  const actionsOf = (label: DocumentLabel): MenuAction[] => [
    { label: '수정', icon: PenSquareIcon, onSelect: () => { save.reset(); setEditing(label); } },
    { label: '삭제', icon: Trash2Icon, onSelect: () => { remove.reset(); setDeleting(label); } },
  ];
  const add = <Button variant="secondary" size="sm" onClick={() => { save.reset(); setEditing('new'); }}>
    <PlusIcon data-icon="inline-start" />라벨 추가
  </Button>;
  return <SettingsPage crumbs={kitCrumbs} title="문서 라벨">
    {labels.data && list.length === 0
      ? <PageState kind="empty" isCompact title="아직 라벨이 없습니다" action={add} />
      : <SettingsSection title={`라벨 ${list.length}`} action={add}>
        <div ref={reorder.list} className={rows.list} role="list" aria-label="라벨 순서">
          {shown.map(label => <div key={label.id} className={cn(rows.row, ADMIN_ROW)} role="listitem" {...reorder.rowProps(label.id)}>
            <button type="button" className={rows.grip} {...reorder.gripProps({ id: label.id, name: label.name })}><GripIcon /></button>
            <DocumentLabelDot color={label.color} />
            <span className={ADMIN_ROW_NAME}>{label.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{(label.uses ?? 0) > 0 ? `문서 ${label.uses}` : '쓰는 문서 없음'}</span>
            <ActionMenu size="row" label={`${label.name} 메뉴`} actions={actionsOf(label)} />
          </div>)}
        </div>
      </SettingsSection>}
    <p id={reorder.hint} className={rows.spoken}>끌어서 순서를 바꿉니다. 손잡이에서 Alt와 위아래 화살표도 쓸 수 있고, 끄는 동안 Esc는 취소입니다.</p>
    <p className={rows.spoken} role="status" aria-live="polite">{reorder.said}</p>
    {failure ? <p className="text-sm text-destructive" role="alert">{failure}</p> : null}
    {editing ? <LabelDialog label={editing === 'new' ? undefined : editing} isPending={save.isPending} error={save.error}
      onClose={() => setEditing(null)} onSave={(name, color) => save.mutate({ label: editing === 'new' ? undefined : editing, name, color })} /> : null}
    <ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }}
      title={`${deleting?.name ?? ''} 라벨을 삭제할까요?`}
      description={remove.error?.message ?? ((deleting?.uses ?? 0) > 0 ? `이 라벨을 붙인 문서 ${deleting?.uses}개에서도 빠집니다.` : '이 라벨을 쓰는 문서는 없습니다.')}
      action={{ label: '삭제', isPending: remove.isPending, onAction: () => { if (deleting) remove.mutate(deleting); } }} />
  </SettingsPage>;
}

/** 라벨 추가 · 수정: its name and one of the palette's colours. */
function LabelDialog({ label, isPending, error, onSave, onClose }: {
  label?: DocumentLabel; isPending: boolean; error: Error | null; onSave: (name: string, color: string) => void; onClose: () => void;
}) {
  const nameId = useId();
  const [name, setName] = useState(label?.name ?? '');
  const [color, setColor] = useState(label?.color ?? DEFAULT_MARK_COLOR);
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={label ? '라벨 수정' : '라벨 추가'} submitLabel={label ? '저장' : '추가'}
    isSubmitDisabled={!name.trim()} isPending={isPending} onSubmit={() => onSave(name.trim(), color)}>
    <Field>
      <FieldLabel htmlFor={nameId}>이름</FieldLabel>
      <Input id={nameId} placeholder="예: 프론트" value={name} autoFocus onChange={event => setName(event.target.value.slice(0, NAME_MAX))} />
    </Field>
    <Field>
      <FieldTitle>색</FieldTitle>
      <ColorPalette label="라벨 색" value={color} onChange={setColor} />
    </Field>
    {error ? <p className="text-sm text-destructive" role="alert">{error.message}</p> : null}
  </FormDialog>;
}
