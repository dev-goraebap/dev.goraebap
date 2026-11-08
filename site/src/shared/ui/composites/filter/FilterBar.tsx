import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Popover } from '@astryxdesign/core/Popover';
import { Text } from '@astryxdesign/core/Text';
import { useState, type ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { FilterValues } from './FilterValues';
import styles from './filter.module.css';
import { OptionList } from './OptionList';
import type { FilterState, ListFilter } from './types';

/**
 * 데스크톱 툴바 아래의 적용 줄: 보이는 필터마다 칩, 아직 없는 필터를 더하는 +, 적용 중이면 모두 지우기. 실제 필터
 * 조건이 있을 때만 이 줄을 만든다(정렬·그룹 변경은 표시 도구가 보인다). 한 번에 메뉴 하나만 연다.
 */
export function FilterBar({ filters, state, shown, onShownChange, onChange, onClear, trailing }: {
  filters: ListFilter[]; state: FilterState; shown: string[]; onShownChange: (keys: string[]) => void;
  onChange: (key: string, values: string[]) => void; onClear: () => void; trailing?: ReactNode;
}) {
  const [opened, setOpened] = useState<{ key: string; part?: 'property' | 'value' }>();
  const unused = filters.filter(filter => !shown.includes(filter.key));
  const hasActive = shown.some(key => (state[key] ?? []).length > 0);
  const add = (key: string) => { onShownChange([...shown, key]); setOpened({ key, part: 'value' }); };
  return <nav className={styles.bar} aria-label="적용한 필터">
    {shown.map(key => filters.find(filter => filter.key === key)).filter(filter => filter !== undefined).map(filter =>
      <FilterChip key={filter.key} filter={filter} chosen={state[filter.key] ?? []} unused={unused}
        open={opened?.key === filter.key ? opened.part : undefined}
        onOpen={part => setOpened(part ? { key: filter.key, part } : undefined)}
        onSwap={next => {
          onChange(filter.key, []);
          onShownChange(shown.map(each => (each === filter.key ? next : each)));
          setOpened({ key: next, part: 'value' });
        }}
        onChange={values => onChange(filter.key, values)}
        onRemove={() => { onChange(filter.key, []); onShownChange(shown.filter(each => each !== filter.key)); }} />)}
    {unused.length > 0
      ? <Popover isOpen={opened?.key === '+'} onOpenChange={isOpen => setOpened(isOpen ? { key: '+' } : undefined)} placement="below" alignment="start"
        width="15rem" label="필터 추가"
        content={<OptionList label="필터 추가" isSearchable={unused.length > 7} options={unused.map(each => ({ value: each.key, label: each.label, icon: icon(each.icon) }))}
          onPick={add} />}>
        <IconButton label="필터 추가" tooltip="필터 추가" variant="ghost" size="sm" icon={icon('plus')} />
      </Popover>
      : null}
    {hasActive ? <Button label="모두 지우기" variant="subtle" size="sm" onClick={onClear} /> : null}
    {trailing}
  </nav>;
}

/**
 * 칩 하나: [속성 | 값 | ×]. 속성은 아직 없는 다른 속성으로 바꾸고, 값은 선택지를 열고, ×는 필터를 뺀다. 값은 두 개까지
 * 이름과 +N, 비었으면 --.
 */
function FilterChip({ filter, chosen, unused, open, onOpen, onSwap, onChange, onRemove }: {
  filter: ListFilter; chosen: string[]; unused: ListFilter[];
  open?: 'property' | 'value'; onOpen: (part?: 'property' | 'value') => void;
  onSwap: (key: string) => void; onChange: (values: string[]) => void; onRemove: () => void;
}) {
  const names = chosen.map(value => filter.options.find(option => option.value === value)?.label ?? value);
  return <span className={styles.chip} role="group" aria-label={`${filter.label} 필터`}>
    <Popover isOpen={open === 'property'} onOpenChange={isOpen => onOpen(isOpen ? 'property' : undefined)} placement="below" alignment="start"
      width="15rem" label="필터 바꾸기" isEnabled={unused.length > 0}
      content={<OptionList label="필터 바꾸기" isSearchable={unused.length > 7} options={unused.map(each => ({ value: each.key, label: each.label, icon: icon(each.icon) }))}
        onPick={onSwap} />}>
      {({ ref, onClick }) => <button ref={ref as never} type="button" className={`${styles.chipPart} ${styles.chipKey}`} aria-expanded={open === 'property'}
        aria-label={`${filter.label}, 다른 필터로 바꾸기`} disabled={unused.length === 0} onClick={onClick}>
        {icon(filter.icon)}{filter.label}
      </button>}
    </Popover>
    <Popover isOpen={open === 'value'} onOpenChange={isOpen => onOpen(isOpen ? 'value' : undefined)} placement="below" alignment="start"
      width="16.25rem" label={`${filter.label} 고르기`}
      content={<FilterValues filter={filter} chosen={chosen} onChange={onChange} onDone={() => onOpen(undefined)} />}>
      {({ ref, onClick }) => <button ref={ref as never} type="button" className={styles.chipPart} aria-expanded={open === 'value'} onClick={onClick}>
        {names.length === 0
          ? <Text color="disabled">--</Text>
          : <>{names.slice(0, 2).join(', ')}{names.length > 2 ? <Text color="secondary">+{names.length - 2}</Text> : null}</>}
      </button>}
    </Popover>
    <button type="button" className={styles.chipPart} aria-label={`${filter.label} 필터 지우기`} onClick={onRemove}>{icon('close')}</button>
  </span>;
}
