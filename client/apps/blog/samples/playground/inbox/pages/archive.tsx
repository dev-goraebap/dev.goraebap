import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/shared/ui/toast';
import { notificationKeys, useNotificationApi, type Notification } from '../entities/notification';

/**
 * 보관하기 · 받은함으로 옮기기. 화면에 결과가 바로 보이지 않는 완료이므로 토스트로 알리고, 보관에는 되돌리기를 둔다.
 * 끝나면 호출한 쪽이 열어 둔 항목을 닫는다(onDone).
 */
export function useArchiveToggle(onDone: () => void) {
  const api = useNotificationApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (item: Notification) => { await (item.archived ? api.restore(item.id) : api.archive(item.id)); return item; },
    onSuccess: async item => {
      await client.invalidateQueries({ queryKey: notificationKeys.all });
      onDone();
      const undo = () => { void api.restore(item.id).then(() => client.invalidateQueries({ queryKey: notificationKeys.all })); };
      toast.add({
        title: item.archived ? '받은함으로 옮겼습니다' : '보관했습니다',
        timeout: 8000,
        actionProps: item.archived ? undefined : { children: '되돌리기', onClick: undo },
      });
    },
  });
}
