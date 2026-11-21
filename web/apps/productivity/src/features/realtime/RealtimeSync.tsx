import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const scopes: Record<string, readonly string[]> = {
  ISSUES: ['workItems', 'code'], DOCUMENTS: ['documents'], PROJECTS: ['projects', 'workItems', 'documents', 'code'],
  NOTIFICATION: ['notifications'], APPROVAL: ['approval', 'leave', 'overtime', 'calendar'],
  ANNOUNCEMENT: ['announcements'], MEETING: ['meetings', 'documents'], PUSH: ['push'], CALENDAR: ['calendar'],
};

/** 서버 신호는 재조회 계기다. 본문 초안은 덮지 않고 Query 캐시만 무효화한다. */
export function RealtimeSync({ userId }: { userId?: string }) {
  const client = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const source = new EventSource('/api/v1/events');
    let opened = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const waiting = new Set<string>();
    source.onopen = () => { if (opened) void client.invalidateQueries(); opened = true; };
    source.addEventListener('signal', event => {
      let signal: { topic?: unknown };
      try { signal = JSON.parse((event as MessageEvent<string>).data); } catch { return; }
      if (!signal || typeof signal.topic !== 'string' || !Object.hasOwn(scopes, signal.topic)) return;
      for (const key of scopes[signal.topic] ?? []) waiting.add(key);
      if (timer || !waiting.size) return;
      timer = setTimeout(() => {
        timer = undefined;
        for (const key of waiting) void client.invalidateQueries({ queryKey: [key] });
        waiting.clear();
      }, 100);
    });
    return () => { source.close(); clearTimeout(timer); };
  }, [client, userId]);
  return null;
}
