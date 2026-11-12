import { useState } from 'react';
import { useIsPhone } from '../../foundations/media';
import { FilterBar } from './FilterBar';
import { FilterMenu } from './FilterMenu';
import { FilterChips, FilterSheet, FilterSheetButton } from './FilterSheet';
import { activeKeys, type FilterState, type ListFilter } from './types';

/**
 * 페이지의 필터 한 벌: 툴바에 둘 도구(tools)와 툴바 아래 적용 줄(applied). 데스크톱은 팝오버와 칩 줄, 휴대폰은 시트와
 * 가로 칩. 확정한 값의 원본은 호출부가 가진다(보통 검증한 URL). 여기서는 화면 상태(보이는 칩, 시트 단계)만 가진다.
 */
export function useFilters(filters: ListFilter[], { state, onStateChange }: {
  state: FilterState; onStateChange: (next: FilterState) => void;
}) {
  const isPhone = useIsPhone();
  const [shown, setShown] = useState<string[]>(() => activeKeys(filters, state));
  const [sheet, setSheet] = useState<{ isOpen: boolean; step?: string }>({ isOpen: false });
  const show = (key: string) => setShown(current => (current.includes(key) ? current : [...current, key]));
  const change = (key: string, values: string[]) => {
    onStateChange({ ...state, [key]: values });
    if (values.length > 0) show(key);
  };
  const remove = (key: string) => { change(key, []); setShown(current => current.filter(each => each !== key)); };
  const clear = () => { onStateChange({}); setShown([]); };
  const count = activeKeys(filters, state).length;
  const tools = isPhone
    ? <>
      <FilterSheetButton count={count} isOpen={sheet.isOpen} onOpen={() => setSheet({ isOpen: true })} />
      <FilterSheet filters={filters} state={state} isOpen={sheet.isOpen} step={sheet.step}
        onStepChange={step => setSheet({ isOpen: true, step })} onOpenChange={isOpen => setSheet({ isOpen })} onChange={change} onClear={clear} />
    </>
    : <FilterMenu filters={filters} state={state} onChange={change} onAdd={show} onClear={clear} />;
  const visible = [...new Set([...shown, ...activeKeys(filters, state)])];
  const applied = isPhone
    ? count > 0 ? <FilterChips filters={filters} state={state} onOpen={step => setSheet({ isOpen: true, step })} onRemove={remove} /> : undefined
    : visible.length > 0 ? <FilterBar filters={filters} state={state} shown={visible} onShownChange={setShown} onChange={change} onClear={clear} /> : undefined;
  return { count, clear, tools, applied };
}
