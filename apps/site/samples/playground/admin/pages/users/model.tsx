import type { Display, SortKey } from '@/shared/ui/composites/filter/DisplayMenu';
import type { ListFilter } from '@/shared/ui/composites/filter/types';
import { roles, statuses, type User } from '../../entities/admin';

/** 사용자 목록 주소의 검증. 필터와 표시는 useAddressFilters·useAddressDisplay가 읽고, 여기서는 검색어와 초대 대화상자 열림을 본다. */
export function validateUsersSearch(raw: Record<string, unknown>): Record<string, unknown> {
  return { ...raw, q: typeof raw.q === 'string' && raw.q ? raw.q : undefined, invite: raw.invite === true || raw.invite === 'true' || undefined };
}

export const filters: ListFilter[] = [
  { key: 'role', label: '역할', icon: 'shield', isMultiple: true, options: roles.map(role => ({ value: role.id, label: role.label })) },
  { key: 'status', label: '상태', icon: 'user', isMultiple: true, options: statuses.map(status => ({ value: status.id, label: status.label })) },
];

export const sorts: SortKey[] = [{ id: 'name', label: '이름', kind: 'text' }, { id: 'lastSeen', label: '마지막 접속', kind: 'date' }];
export const initialDisplay: Display = { sort: 'name', direction: 'asc' };

/** 조회 결과에 검색·필터·정렬을 적용한다. 접속 기록이 없는 사용자는 가장 오래된 쪽에 둔다. */
export function visibleUsers(users: User[], words: string, state: Record<string, string[]>, display: Display) {
  const needle = words.trim().toLowerCase();
  const kept = users.filter(user => (!needle || `${user.name} ${user.email}`.toLowerCase().includes(needle))
    && (!state.role?.length || state.role.includes(user.role)) && (!state.status?.length || state.status.includes(user.status)));
  const sorted = [...kept].sort((a, b) => display.sort === 'lastSeen' ? (a.lastSeen ?? '').localeCompare(b.lastSeen ?? '') : a.name.localeCompare(b.name, 'ko'));
  return display.direction === 'desc' ? sorted.reverse() : sorted;
}

/** 마지막 접속: 접속한 적 없으면 그렇다고 쓴다. */
export function lastSeenText(value: string | null) {
  if (!value) return '접속 기록 없음';
  return new Date(value).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

/** 초대 칸의 입력을 이메일 목록으로 나눈다. 쉼표·공백·줄바꿈으로 구분하고 중복은 하나로 합친다. */
export function parseEmails(text: string) {
  const emails = [...new Set(text.split(/[\s,;]+/).map(each => each.trim()).filter(Boolean))];
  const invalid = emails.find(each => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(each));
  return { emails, invalid };
}
