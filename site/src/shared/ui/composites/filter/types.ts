import type { ReactNode } from 'react';
import type { IconName } from '../../foundations/icons/solar-icon';

/** 필터가 가질 수 있는 값 하나: 이름과, 있으면 표시(아이콘·사진·색 점). */
export type FilterOption = { value: string; label: string; icon?: ReactNode };

/**
 * 목록을 거를 수 있는 속성. 여러 값(isMultiple) 또는 하나, 많으면 검색(isSearchable). 연산자는 없다: 같은 속성 안의
 * 값은 OR, 다른 속성끼리는 AND. 값이 하나 이상일 때만 적용 중이다.
 */
export type ListFilter = { key: string; label: string; icon: IconName; options: FilterOption[]; isMultiple?: boolean; isSearchable?: boolean };

/** 필터 키별로 고른 값. 값이 없는 키는 적용 중이 아니다. */
export type FilterState = Record<string, string[]>;

export const activeKeys = (filters: ListFilter[], state: FilterState) =>
  filters.filter(filter => (state[filter.key] ?? []).length > 0).map(filter => filter.key);

/** 값의 요약: 없으면 전체, 여럿이면 첫 이름과 외 N. */
export function valueText(filter: ListFilter, chosen: string[] = []): string {
  if (chosen.length === 0) return '전체';
  const first = filter.options.find(option => option.value === chosen[0])?.label ?? chosen[0];
  return chosen.length > 1 ? `${first} 외 ${chosen.length - 1}` : first;
}

/** 값을 하나 골랐을 때의 다음 값: 여럿이면 토글, 하나면 교체(같은 값을 다시 고르면 해제). */
export function picked(filter: ListFilter, chosen: string[] = [], value: string): string[] {
  if (filter.isMultiple) return chosen.includes(value) ? chosen.filter(each => each !== value) : [...chosen, value];
  return chosen[0] === value ? [] : [value];
}
