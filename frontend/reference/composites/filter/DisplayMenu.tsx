import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState, type ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { useToolSize } from '../../foundations/media';
import { AdaptivePopover } from '../popup/AdaptivePopover';
import styles from './filter.module.css';

export type SortKey = { id: string; label: string; kind: 'date' | 'text' | 'rank' };
export type Display = { layout?: string; sort: string; direction: 'desc' | 'asc'; group?: string };
export type DisplayChoice = { id: string; label: string; icon?: Parameters<typeof icon>[0] };

const DIRECTIONS: Record<SortKey['kind'], [desc: string, asc: string]> = {
  date: ['최신 → 오래된', '오래된 → 최신'],
  text: ['하 → 가', '가 → 하'],
  rank: ['높은 → 낮은', '낮은 → 높은'],
};

/**
 * 표시 도구: 보기 방식(선택), 정렬 기준, 기준에 맞는 말로 쓴 방향, 그룹(선택)을 알약 줄로 고른다. 기본과 다르면 모서리
 * 점과 초기화. 필터가 아니므로 적용 줄을 만들지 않는다. 그룹이 없는 목록은 그룹 구역을 두지 않는다.
 */
export function DisplayMenu({ layouts, sorts, groups, value, initial, onChange }: {
  layouts?: DisplayChoice[]; sorts: SortKey[]; groups?: DisplayChoice[]; value: Display; initial: Display; onChange: (value: Display) => void;
}) {
  const size = useToolSize();
  const [isOpen, setOpen] = useState(false);
  const isTweaked = value.layout !== initial.layout || value.sort !== initial.sort || value.direction !== initial.direction || value.group !== initial.group;
  const kind = sorts.find(sort => sort.id === value.sort)?.kind ?? 'date';
  const pills = (items: DisplayChoice[], current: string | undefined, pick: (id: string) => void) =>
    <HStack gap={1} wrap="wrap">
      {items.map(item => <Button key={item.id} label={item.label} size="sm" variant={item.id === current ? 'view-active' : 'view'}
        icon={item.icon ? icon(item.icon, item.id === current) : undefined} aria-pressed={item.id === current} onClick={() => pick(item.id)} />)}
    </HStack>;
  const section = (title: string, body: ReactNode) => <VStack gap={1.5} role="group" aria-label={title}>
    <Text type="supporting" color="secondary" weight="medium">{title}</Text>{body}
  </VStack>;
  return <AdaptivePopover label="표시" alignment="end" width="20rem" onOpenChange={setOpen}
    trigger={<HStack className={styles.trigger}>
      <Button label={isTweaked ? '표시, 기본과 다름' : '표시'} tooltip="표시" variant={isOpen || isTweaked ? 'view-active' : 'tool'} size={size} isIconOnly
        icon={icon('sort', isOpen || isTweaked)} />
      {isTweaked ? <StatusDot className={styles.dot} variant="accent" label="표시 바뀜" /> : null}
    </HStack>}
    content={() => <VStack gap={4} padding={2}>
      {layouts?.length ? section('보기', pills(layouts, value.layout, layout => onChange({ ...value, layout }))) : null}
      {section('정렬 기준', pills(sorts, value.sort, sort => onChange({ ...value, sort })))}
      {section('방향', pills([{ id: 'desc', label: DIRECTIONS[kind][0] }, { id: 'asc', label: DIRECTIONS[kind][1] }], value.direction,
        direction => onChange({ ...value, direction: direction as Display['direction'] })))}
      {groups?.length ? section('그룹', pills(groups, value.group, group => onChange({ ...value, group }))) : null}
      {isTweaked ? <HStack hAlign="end"><Button label="기본 표시로 초기화" variant="subtle" size="sm" onClick={() => onChange(initial)} /></HStack> : null}
    </VStack>} />;
}
