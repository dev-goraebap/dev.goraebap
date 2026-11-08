import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { icon } from '../../foundations/icons/solar-icon';
import { useToolSize } from '../../foundations/media';
import { SheetBody } from '../popup/SheetBody';
import { FilterValues } from './FilterValues';
import styles from './filter.module.css';
import { activeKeys, valueText, type FilterState, type ListFilter } from './types';

/**
 * 휴대폰 필터: 두 단계 바텀시트. 먼저 모든 속성(아이콘·이름·고른 값 요약·꺾쇠), 고르면 그 값 목록을 터치 크기로.
 * 선택은 바로 적용하고 바닥에는 적용 중일 때 모두 지우기와 완료가 있다. step은 열린 속성(없으면 목록).
 */
export function FilterSheet({ filters, state, isOpen, step, onStepChange, onOpenChange, onChange, onClear }: {
  filters: ListFilter[]; state: FilterState; isOpen: boolean; step?: string;
  onStepChange: (key?: string) => void; onOpenChange: (isOpen: boolean) => void;
  onChange: (key: string, values: string[]) => void; onClear: () => void;
}) {
  const filter = filters.find(each => each.key === step);
  const hasActive = activeKeys(filters, state).length > 0;
  return <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange} label={filter ? `${filter.label} 고르기` : '필터'} height="hug">
    <SheetBody gap={2}>
      {filter
        ? <>
          <HStack gap={1.5} vAlign="center">
            <IconButton label="필터 목록으로" variant="ghost" size="sm" icon={icon('back')} onClick={() => onStepChange(undefined)} />
            {icon(filter.icon)}<Text weight="semibold">{filter.label}</Text>
          </HStack>
          <FilterValues filter={filter} chosen={state[filter.key]} size="lg" onChange={values => onChange(filter.key, values)} onDone={() => onStepChange(undefined)} />
        </>
        : <ul className={styles.list} aria-label="필터">
          {filters.map(each => <li key={each.key}>
            <button type="button" className={styles.option} data-size="lg" onClick={() => onStepChange(each.key)}>
              {icon(each.icon, (state[each.key] ?? []).length > 0)}
              <Text className={styles.optionLabel}>{each.label}</Text>
              <Text color="secondary">{valueText(each, state[each.key])}</Text>
              {icon('forward')}
            </button>
          </li>)}
        </ul>}
      <HStack data-action-row gap={2} hAlign="end" paddingBlockStart={2}>
        {hasActive ? <Button label="모두 지우기" variant="subtle" onClick={onClear} /> : null}
        <Button label="완료" variant="view-active" onClick={() => onOpenChange(false)} />
      </HStack>
    </SheetBody>
  </BottomSheet>;
}

/** 휴대폰 필터 버튼: 데스크톱 도구와 같은 모양, 적용 중이면 점, 개수는 이름에. */
export function FilterSheetButton({ count, isOpen, onOpen }: { count: number; isOpen: boolean; onOpen: () => void }) {
  const size = useToolSize();
  const isOn = isOpen || count > 0;
  return <HStack className={styles.trigger}>
    <Button label={count > 0 ? `필터 ${count}개 적용 중` : '필터'} variant={isOn ? 'view-active' : 'tool'} size={size} isIconOnly
      aria-haspopup="dialog" aria-expanded={isOpen} icon={icon('filter', isOn)} onClick={onOpen} />
    {count > 0 ? <StatusDot className={styles.dot} variant="accent" label="필터 적용 중" /> : null}
  </HStack>;
}

/** 휴대폰 적용 칩: 툴바 아래 자체 가로 스크롤 줄. 누르면 그 속성에서 시트를 열고 ×로 뺀다. 적용 중일 때만. */
export function FilterChips({ filters, state, onOpen, onRemove }: {
  filters: ListFilter[]; state: FilterState; onOpen: (key: string) => void; onRemove: (key: string) => void;
}) {
  const active = filters.filter(filter => activeKeys(filters, state).includes(filter.key));
  if (active.length === 0) return null;
  return <nav className={styles.chips} aria-label="적용한 필터">
    {active.map(filter => <HStack key={filter.key} className={styles.phoneChip} vAlign="center" role="group" aria-label={`${filter.label} 필터`}>
      <button type="button" className={styles.phoneChipPart} onClick={() => onOpen(filter.key)}>
        <b>{filter.label}</b><small>{valueText(filter, state[filter.key])}</small>
      </button>
      <button type="button" className={styles.phoneChipPart} aria-label={`${filter.label} 필터 지우기`} onClick={() => onRemove(filter.key)}>
        {icon('close')}
      </button>
    </HStack>)}
  </nav>;
}
