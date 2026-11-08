import { Button } from '@astryxdesign/core/Button';
import { Calendar, type ISODateString } from '@astryxdesign/core/Calendar';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';
import { icon, type IconName } from '../../foundations/icons/solar-icon';
import { useIsPhone } from '../../foundations/media';
import { OptionList } from '../filter/OptionList';
import { AdaptivePopover } from '../popup/AdaptivePopover';
import styles from './property.module.css';

export type PropertyOption = { value: string; label: string; icon?: ReactNode };

/**
 * 작성·상세의 속성 하나. 24px(휴대폰 32px) 알약이며 비었으면 속성의 아이콘과 이름, 정하면 값을 보인다. 누르면 곁에서
 * 고르는 것을 연다(데스크톱 팝오버, 휴대폰 시트). 필수 속성은 고르기 전에 *와 접근 가능한 이름 "(필수)"로 알린다.
 * 넓은 상세의 오른쪽 열(DetailLayout)에서는 같은 요소가 테두리 없는 행이 된다. isDisabled는 값만 보인다.
 */
export function PropertyPill({ label, icon: mark, text, isEmpty, isRequired, isInvalid = false, isDisabled = false, onPress, content, width = '15rem', sheetHeight = 'hug' }: {
  label: string; icon: ReactNode; text?: ReactNode; isEmpty: boolean; isRequired?: boolean;
  /** 제출 검사에서 빠진 필수 속성. 테두리로 표시하고 aria-invalid를 둔다. 설명은 알약 줄 곁에 둔다. */
  isInvalid?: boolean; isDisabled?: boolean;
  onPress?: () => void; content?: (close: () => void) => ReactNode; width?: string; sheetHeight?: 'hug' | 'tall';
}) {
  const name = isEmpty && isRequired ? `${label} (필수)` : isEmpty ? label : `${label}: ${typeof text === 'string' ? text : ''}`.replace(/: $/, '');
  const face = <>
    {mark}
    <Text className={styles.text} maxLines={1} hasTruncateTooltip={false}>{isEmpty ? label : text}</Text>
    {isEmpty && isRequired ? <Text className={styles.required} aria-hidden>*</Text> : null}
  </>;
  const title = typeof text === 'string' ? text : undefined;
  if (isDisabled || onPress || !content)
    return <button type="button" className={styles.pill} data-empty={isEmpty || undefined} aria-invalid={isInvalid || undefined} aria-label={name} title={title} disabled={!onPress}
      onClick={onPress}>{face}</button>;
  return <AdaptivePopover label={label} width={width} sheetHeight={sheetHeight} content={content}
    trigger={<button type="button" className={styles.pill} data-empty={isEmpty || undefined} aria-invalid={isInvalid || undefined} aria-label={name} title={title}>{face}</button>} />;
}

/**
 * 선택지에서 고르는 속성. 하나(고르면 닫힘) 또는 여럿(열린 채 계속, 첫 값과 개수 표시). 8개 이상이면 검색을 둔다.
 */
export function OptionPill({ label, icon: name, options, value, onChange, isMultiple, isRequired, isInvalid, isDisabled, emptyText }: {
  label: string; icon: IconName; options: PropertyOption[]; isRequired?: boolean; isInvalid?: boolean; isDisabled?: boolean; emptyText?: string;
} & ({ isMultiple?: false; value?: string; onChange: (value: string) => void } | { isMultiple: true; value: string[]; onChange: (value: string[]) => void })) {
  const isPhone = useIsPhone();
  const chosen = isMultiple ? value : value ? [value] : [];
  const picked = options.filter(option => chosen.includes(option.value));
  const first = picked[0];
  const text = !first ? undefined : picked.length === 1 ? first.label : `${first.label} 외 ${picked.length - 1}`;
  const mark = first?.icon ?? icon(name, !!first);
  return <PropertyPill label={emptyText && !first ? emptyText : label} icon={mark} text={text} isEmpty={!first} isRequired={isRequired} isInvalid={isInvalid} isDisabled={isDisabled}
    sheetHeight={options.length > 7 ? 'tall' : 'hug'}
    content={close => <OptionList label={`${label} 고르기`} options={options} chosen={chosen} isMultiple={isMultiple} isSearchable={options.length > 7}
      size={isPhone ? 'lg' : 'sm'}
      onPick={next => {
        if (isMultiple) onChange(chosen.includes(next) ? chosen.filter(each => each !== next) : [...chosen, next]);
        else { onChange(next); close(); }
      }} />} />;
}

const isoOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const daysFrom = (day: string, days: number) => { const date = new Date(`${day}T00:00:00`); date.setDate(date.getDate() + days); return isoOf(date); };
const between = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / 86_400_000);

/** 오늘과의 거리로 쓴 날: 오늘, 내일, 5일 뒤, 2일 지남. */
export function dueText(day: string, today: string) {
  const days = between(today, day);
  return days === 0 ? '오늘' : days === 1 ? '내일' : days > 1 ? `${days}일 뒤` : `${-days}일 지남`;
}

/** 날짜 속성: 자주 쓰는 날과 공통 달력, 지우기. 날짜 입력은 언제나 같은 Astryx 달력을 쓴다. */
export function DatePill({ label, value, onChange, today = isoOf(new Date()), isDisabled }: {
  label: string; value?: string; onChange: (day?: string) => void; today?: string; isDisabled?: boolean;
}) {
  const presets: [string, string][] = [['오늘', today], ['내일', daysFrom(today, 1)], ['다음 주', daysFrom(today, 7)]];
  return <PropertyPill label={label} icon={icon('calendar', !!value)} isEmpty={!value} isDisabled={isDisabled}
    text={value ? `${label} ${dueText(value, today)}` : undefined}
    width="18rem" content={close => <VStack gap={2}>
      <HStack gap={1} wrap="wrap">
        {presets.map(([name, day]) => <Button key={name} label={name} variant="view" size="sm" onClick={() => { onChange(day); close(); }} />)}
        {value ? <Button label="지우기" variant="subtle" size="sm" onClick={() => { onChange(undefined); close(); }} /> : null}
      </HStack>
      <Calendar value={value as ISODateString | undefined} weekStartsOn="sun" onChange={day => { onChange(day); close(); }} />
    </VStack>} />;
}
