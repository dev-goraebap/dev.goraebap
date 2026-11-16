import type { FilterDef } from '@/shared/ui/filter';
import { ShieldCheckIcon, UserIcon } from '@/shared/ui/icon';
import { roles, statuses, type User } from '../../entities/admin';

/** 사용자 목록 주소의 검증. 필터와 표시는 키트의 useAddressFilters · useAddressChoices가 읽고, 여기서는 검색어와 초대 양식 열림을 본다. */
export function validateUsersSearch(raw: Record<string, unknown>): Record<string, unknown> {
  return { ...raw, q: typeof raw.q === 'string' && raw.q ? raw.q : undefined, invite: raw.invite === true || raw.invite === 'true' || undefined };
}

export type FilterKey = 'role' | 'status';
export const filterKeys: FilterKey[] = ['role', 'status'];
export const filters: FilterDef<FilterKey>[] = [
  { key: 'role', label: '역할', icon: ShieldCheckIcon, options: roles.map(role => ({ value: role.id, label: role.label })) },
  { key: 'status', label: '상태', icon: UserIcon, options: statuses.map(status => ({ value: status.id, label: status.label })) },
];

/** 표시(정렬 · 방향). 표 머리를 눌러도 같은 값이 바뀐다. 주소에는 처음과 다른 값만 남는다. */
export type Display = { sort: 'name' | 'lastSeen'; direction: 'asc' | 'desc' };
export const initialDisplay: Display = { sort: 'name', direction: 'asc' };
export const sorts: { value: Display['sort']; label: string }[] = [{ value: 'name', label: '이름' }, { value: 'lastSeen', label: '마지막 접속' }];
export const directions: { value: Display['direction']; label: string }[] = [{ value: 'asc', label: '오름차순' }, { value: 'desc', label: '내림차순' }];
export const allowedDisplay = { sort: sorts.map(each => each.value), direction: directions.map(each => each.value) };

/** 조회 결과에 검색 · 필터 · 정렬을 적용한다. 접속 기록이 없는 사용자는 가장 오래된 쪽에 둔다. */
export function visibleUsers(users: User[], words: string, state: Partial<Record<FilterKey, string[]>>, display: Display) {
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

/** 초대 칸의 입력을 이메일 목록으로 나눈다. 쉼표 · 공백 · 줄바꿈으로 구분하고 중복은 하나로 합친다. */
export function parseEmails(text: string) {
  const emails = [...new Set(text.split(/[\s,;]+/).map(each => each.trim()).filter(Boolean))];
  const invalid = emails.find(each => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(each));
  return { emails, invalid };
}
