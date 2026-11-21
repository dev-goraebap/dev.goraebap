import { useMutation, useQueryClient } from '@tanstack/react-query';
import { draftOf, editWorkItem, refreshWorkItems, workItemOptions, type WorkItemDraft, type WorkItemRow } from '@/entities/work-item';
import { toast } from '@/shared/ui/kit/toast';

/** 되돌리기 토스트가 떠 있는 시간. 잘못 누른 것을 알아차리고 누를 만큼만 둔다. */
const UNDO_MS = 5000;
const NAMES: Partial<Record<keyof WorkItemDraft, string>> = {
  columnId: '상태', priority: '우선순위', type: '유형', assigneeId: '담당자', startDate: '시작일', dueDate: '마감일', labelIds: '라벨',
  parentId: '상위 업무', title: '제목', storyPoints: '스토리 포인트', estimateHours: '추정시간', cycleId: '사이클',
};
/** 이름 뒤에 을/를을 붙인다(마지막 글자의 받침으로 고른다: 상태를, 마감일을). */
const withObject = (name: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code < 11172 && code % 28 !== 0 ? '을' : '를');
};

/**
 * Changes one property of a work item: every property goes with it as the work item was read, over its version. A change that
 * came after another one (409) or was refused is kept as the problem to say; the work item is read again either way.
 * 속성을 바꾸면(change) 5초 동안 "되돌리기" 토스트를 띄운다. 누르면 최신 업무를 다시 읽고, 바꾼 속성만 바꾸기 전 값으로
 * 돌린다(그 사이 다른 속성을 누가 바꿨어도 그것은 그대로 둔다). 제목처럼 편집과 함께 저장하는 changeAsync는 띄우지 않는다.
 */
export function useWorkItemChange(workItem: WorkItemRow | undefined) {
  const client = useQueryClient();
  const edit = useMutation({
    mutationFn: ({ patch, expectedVersion }: { patch: Partial<WorkItemDraft>; expectedVersion?: number }) => (workItem ? editWorkItem({ ...workItem, version: expectedVersion ?? workItem.version }, { ...draftOf(workItem), ...patch }) : Promise.resolve()),
    onSettled: () => refreshWorkItems(client),
  });
  const undo = async (row: WorkItemRow, before: Partial<WorkItemDraft>) => {
    const latest = await client.query({ ...workItemOptions(row.projectKey, row.number), staleTime: 0 });
    await editWorkItem(latest.issue, { ...draftOf(latest.issue), ...before });
    await refreshWorkItems(client);
  };
  const offerUndo = (row: WorkItemRow, patch: Partial<WorkItemDraft>) => {
    const keys = Object.keys(patch) as (keyof WorkItemDraft)[];
    const draft = draftOf(row);
    const before = Object.fromEntries(keys.map(key => [key, draft[key]])) as Partial<WorkItemDraft>;
    const name = keys.map(key => NAMES[key]).filter(Boolean).join(' · ') || '속성';
    let isUndone = false;
    const onUndo = () => {
      if (isUndone) return;
      isUndone = true;
      undo(row, before).then(() => toast.add({ title: `${withObject(name)} 되돌렸습니다.` }), (error: unknown) =>
        toast.add({ type: 'error', title: error instanceof Error ? error.message : '되돌리지 못했습니다.' }));
    };
    // 남은 시간을 줄어드는 막대로 보이고, 포인터를 올리면 닫히기까지의 시간과 막대가 함께 멈춘다. 되돌리기를 누르면 바로 닫는다.
    const id = toast.add({
      title: `${withObject(name)} 바꿨습니다.`, timeout: UNDO_MS, data: { countdown: true },
      actionProps: { children: '되돌리기', onClick: () => { toast.close(id); onUndo(); } },
    });
  };
  return {
    changeAsync: (patch: Partial<WorkItemDraft>, expectedVersion?: number) => edit.mutateAsync({ patch, expectedVersion }),
    change: (patch: Partial<WorkItemDraft>) => {
      const row = workItem;
      edit.mutate({ patch }, { onSuccess: () => { if (row) offerUndo(row, patch); } });
    },
    isPending: edit.isPending, error: edit.error, reset: edit.reset,
  };
}
