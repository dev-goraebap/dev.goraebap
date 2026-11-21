import { getJson, type components } from '@/shared/api';
import type { Icon } from '@/shared/ui/kit/icon';
import type { SearchHit, SearchSource } from './search';

type Found = { groups?: { kind?: string; hits?: components['schemas']['SearchHit'][] }[] };

/** The kinds the server searches (GET /api/v1/search), in its order, with their group title and mark. */
const KINDS = [
  { kind: 'work-item', title: '업무', icon: 'tasks' },
  { kind: 'document', title: '문서', icon: 'document' },
  { kind: 'meeting', title: '회의록', icon: 'meeting' },
  { kind: 'event', title: '일정', icon: 'calendar' },
  { kind: 'announcement', title: '공지', icon: 'notice' },
  { kind: 'weekly-report', title: '주간보고', icon: 'checklist' },
] as const;

/**
 * 탐색's sources for what the member's spaces hold (업무 · 문서 · 회의록 · 일정 · 공지 · 주간보고): one request for the
 * words, asked once however many sources read it, each source taking its kind's group. A failed request finds nothing.
 */
export function contentSources(icon: (name: string) => Icon): SearchSource[] {
  let asked: { words: string; found: Promise<Found> } | undefined;
  const find = (words: string) => {
    if (asked?.words !== words)
      asked = { words, found: getJson<Found>(`/api/v1/search?${new URLSearchParams({ q: words.trim() })}`) };
    return asked.found;
  };
  return KINDS.map(({ kind, title, icon: mark }) => ({
    id: kind, title,
    find: async words => {
      const group = (await find(words)).groups?.find(each => each.kind === kind);
      return (group?.hits ?? []).flatMap((hit): SearchHit[] => hit.id && hit.path
        ? [{ id: `${kind}:${hit.id}`, label: hit.title ?? '', where: hit.where ?? '', icon: icon(mark), href: hit.path }]
        : []);
    },
  }));
}
