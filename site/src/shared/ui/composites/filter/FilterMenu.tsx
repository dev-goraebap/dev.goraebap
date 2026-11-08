import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Popover } from '@astryxdesign/core/Popover';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { useToolSize } from '../../foundations/media';
import { FilterValues } from './FilterValues';
import styles from './filter.module.css';
import { OptionList } from './OptionList';
import { activeKeys, type FilterState, type ListFilter } from './types';

/**
 * 데스크톱 필터 도구: 둥근 버튼이 속성 목록(적용 중인 것에 체크)을 열고, 속성을 고르면 같은 팝오버가 값 목록으로 바뀐다.
 * 머리의 ←는 속성 목록으로 돌아간다. 적용 중이면 모서리 점과 Bold Duotone, 접근 가능한 이름에 개수.
 */
export function FilterMenu({ filters, state, onChange, onAdd }: {
  filters: ListFilter[]; state: FilterState; onChange: (key: string, values: string[]) => void;
  /** 여기서 고른 속성을 적용 줄에 바로 칩으로 보이게 알린다. */
  onAdd?: (key: string) => void;
}) {
  const size = useToolSize();
  const [isOpen, setOpen] = useState(false);
  const [key, setKey] = useState<string>();
  const filter = filters.find(each => each.key === key);
  const active = activeKeys(filters, state);
  const openChange = (open: boolean) => { setOpen(open); setKey(undefined); };
  const isOn = isOpen || active.length > 0;
  // Escape로 초점이 돌아올 때 Tooltip의 native popover가 다시 열리는 충돌을 피한다. 버튼 이름은 label로 제공한다.
  return <Popover isOpen={isOpen} onOpenChange={openChange} placement="below" alignment="end" width="16.25rem"
    label={filter ? `${filter.label} 고르기` : '필터'}
    content={filter
      ? <VStack>
        <header className={styles.head}>
          <IconButton label="필터 목록으로" variant="ghost" size="sm" icon={icon('back')} onClick={() => setKey(undefined)} />
          {icon(filter.icon)}{filter.label}
        </header>
        <FilterValues key={filter.key} filter={filter} chosen={state[filter.key]} onChange={values => onChange(filter.key, values)} onDone={() => openChange(false)} />
      </VStack>
      : <OptionList label="필터 찾기" isSearchable={filters.length > 7} chosen={active}
        options={filters.map(each => ({ value: each.key, label: each.label, icon: icon(each.icon) }))}
        onPick={next => { setKey(next); onAdd?.(next); }} />}>
    {({ ref, onClick }) => <HStack ref={ref} className={styles.trigger}>
      <Button label={active.length > 0 ? `필터 ${active.length}개 적용 중` : '필터'} variant={isOn ? 'view-active' : 'tool'} size={size} isIconOnly
        aria-expanded={isOpen} icon={icon('filter', isOn)} onClick={onClick} />
      {active.length > 0 ? <StatusDot className={styles.dot} variant="accent" label="필터 적용 중" /> : null}
    </HStack>}
  </Popover>;
}
