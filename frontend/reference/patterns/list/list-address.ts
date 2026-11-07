import { useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { Display } from '../../composites/filter/DisplayMenu';
import type { FilterState, ListFilter } from '../../composites/filter/types';

/**
 * 목록의 확정 조건(검색·필터·표시)은 주소가 가진다. 바꿀 때는 새 기록을 만들지 않고(replace) 현재 주소를 고쳐, 뒤로·
 * 새로고침·공유한 링크에서 같은 목록이 돌아온다. 다른 검색 값은 그대로 둔다. 기본값과 같은 값은 주소에서 뺀다.
 */
export function useAddressWriter() {
  const navigate = useNavigate();
  const router = useRouter();
  return (changes: Record<string, string | undefined>) => {
    // 한 이벤트에서 여러 번 고쳐도 앞의 변경을 덮지 않도록 호출 시점의 주소를 읽는다.
    const location = router.state.location;
    const current = location.search as Record<string, unknown>;
    const next: Record<string, unknown> = { ...current };
    for (const [key, value] of Object.entries(changes)) {
      if (value) next[key] = value; else delete next[key];
    }
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    void navigate({ to: location.pathname, search: next as never, replace: true });
  };
}

/** 필터 값: 키마다 쉼표로 이은 값. 선택지가 아직 오지 않았을 수 있어 적힌 대로 읽는다. */
export function useAddressFilters(filters: ListFilter[]): [FilterState, (next: FilterState) => void] {
  const search = useLocation().search as Record<string, unknown>;
  const write = useAddressWriter();
  const state: FilterState = {};
  for (const filter of filters) {
    const values = String(search[filter.key] ?? '').split(',').filter(Boolean);
    if (values.length) state[filter.key] = values;
  }
  return [state, next => write(Object.fromEntries(filters.map(filter => [filter.key, (next[filter.key] ?? []).join(',') || undefined])))];
}

/** 검색어: 칸은 입력을 바로 보이고 주소는 300ms 뒤 따라간다(입력 중 기록을 쌓지 않는다). */
export function useAddressWords(key = 'q'): [string, (words: string) => void] {
  const search = useLocation().search as Record<string, unknown>;
  const inAddress = String(search[key] ?? '');
  const [words, setWords] = useState(inAddress);
  const write = useAddressWriter();
  const latest = useRef(write);
  latest.current = write;
  const typed = useRef(inAddress);
  useEffect(() => { if (inAddress !== typed.current) { typed.current = inAddress; setWords(inAddress); } }, [inAddress]);
  useEffect(() => {
    if (words === typed.current) return undefined;
    const timer = setTimeout(() => { typed.current = words.trim(); latest.current({ [key]: words.trim() || undefined }); }, 300);
    return () => clearTimeout(timer);
  }, [key, words]);
  return [words, setWords];
}

/** 표시(보기·정렬·방향·그룹): 기본과 다른 값만 주소에 둔다. */
export function useAddressDisplay(initial: Display, allowed: { layouts?: string[]; sorts: string[]; groups?: string[] }): [Display, (next: Display) => void] {
  const search = useLocation().search as Record<string, unknown>;
  const write = useAddressWriter();
  const read = (key: string, values: string[] | undefined, fallback?: string) => {
    const value = search[key];
    return typeof value === 'string' && values?.includes(value) ? value : fallback;
  };
  const value: Display = {
    layout: read('layout', allowed.layouts, initial.layout),
    sort: read('sort', allowed.sorts, initial.sort)!,
    direction: search.direction === 'asc' || search.direction === 'desc' ? search.direction : initial.direction,
    group: read('group', allowed.groups, initial.group),
  };
  return [value, next => write({
    layout: next.layout === initial.layout ? undefined : next.layout,
    sort: next.sort === initial.sort ? undefined : next.sort,
    direction: next.direction === initial.direction ? undefined : next.direction,
    group: next.group === initial.group ? undefined : next.group,
  })];
}
