import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { EditingStore } from './use-rich-body';

/** 잠금 없이 편집자를 알린다. 창마다 별도 임대를 쓰므로 한 창을 닫아도 다른 창의 표시가 남는다. */
export function useBodyPresence(store: EditingStore | undefined, isEditing: boolean) {
  const client = useQueryClient();
  const [failure, setFailure] = useState('');
  const query = useQuery({ queryKey: store?.key ?? ['body-editing-unavailable'], queryFn: () => store!.read(),
    enabled: !!store, refetchInterval: 30_000, meta: { keepsPageVisible: true } });
  useEffect(() => {
    if (!store || !isEditing) return;
    const lease = crypto.randomUUID();
    let closed = false;
    let pending: Promise<unknown> = Promise.resolve();
    const beat = () => {
      pending = pending.then(() => closed ? undefined : store.keep(lease))
        .then(() => { if (!closed) setFailure(''); })
        .catch(() => { if (!closed) setFailure('편집 중 표시를 보내지 못했습니다. 다른 사람도 이 문서를 수정할 수 있습니다.'); });
    };
    const visible = () => { if (!document.hidden) beat(); };
    beat();
    const timer = setInterval(beat, 30_000);
    document.addEventListener('visibilitychange', visible);
    return () => {
      closed = true; clearInterval(timer); document.removeEventListener('visibilitychange', visible);
      void pending.then(() => store.leave(lease)).then(() => client.invalidateQueries({ queryKey: store.key })).catch(() => undefined);
    };
  }, [store, isEditing, client]);
  return { others: query.isError ? [] : query.data ?? [], failure };
}
