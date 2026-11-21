import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteWorkItem, refreshWorkItems } from '../api/work-items';
import type { WorkItemRow } from '../model/types';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';

/** 업무 삭제 확인. 지우면 목록·보드에서 사라지고 번호는 다시 쓰지 않는다. 다른 변경이 먼저 들어오면 서버의 이유를 보여 준다. */
export function DeleteWorkItemDialog({ workItem, isOpen, onClose, onDeleted }: {
  workItem: WorkItemRow; isOpen: boolean; onClose: () => void; onDeleted?: () => void;
}) {
  const client = useQueryClient();
  const remove = useMutation({
    mutationFn: (row: WorkItemRow) => deleteWorkItem(row),
    onSuccess: () => { onClose(); onDeleted?.(); },
    onSettled: () => refreshWorkItems(client),
  });
  return <ConfirmDialog open={isOpen} onOpenChange={open => { if (!open && !remove.isPending) { remove.reset(); onClose(); } }}
    title={`${workItem.ref} 업무를 지울까요?`} description={remove.error?.message ?? '업무가 목록과 보드에서 사라집니다. 번호는 다시 쓰지 않습니다.'}
    action={{ label: '삭제', onAction: () => remove.mutate(workItem), isPending: remove.isPending }} />;
}
