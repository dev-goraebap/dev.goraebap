import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import styles from './filter.module.css';
import type { FilterOption } from './types';

/** 검색 전 보여 줄 행 수(고른 항목은 늘 함께 보인다). */
export const FIRST = 8;
/** 검색 결과의 최대 행 수. 서버 한도와 별개이며 프로젝트가 조절한다. */
export const FOUND = 50;

/**
 * 메뉴의 선택지. 많으면 위에 검색 칸(초점을 받는다)을 두고 처음 8개와 고른 항목, 입력하면 최대 50개를 보인다. 무제한
 * 렌더링하지 않는다. 여럿 고르기는 앞의 상자, 하나 고르기는 끝의 체크. size lg는 휴대폰 터치 행(44px)이다.
 */
export function OptionList({ label, options, chosen, isMultiple, isSearchable, onPick, size = 'sm' }: {
  label: string; options: FilterOption[]; chosen?: string[]; isMultiple?: boolean; isSearchable?: boolean;
  onPick: (value: string) => void; size?: 'sm' | 'lg';
}) {
  const [words, setWords] = useState('');
  const needle = words.trim().toLowerCase();
  const matches = options.filter(option => !needle || option.label.toLowerCase().includes(needle));
  const head = isSearchable ? matches.slice(0, needle ? FOUND : FIRST) : matches;
  const found = needle || !chosen ? head : [...head, ...matches.filter(option => chosen.includes(option.value) && !head.includes(option))];
  const rest = isSearchable ? matches.length - found.length : 0;
  return <VStack gap={1}>
    {isSearchable ? <TextInput label={label} isLabelHidden size="sm" placeholder="이름으로 찾기" value={words} hasAutoFocus onChange={setWords} /> : null}
    {found.length === 0 ? <p className={styles.note} role="status">찾은 것이 없습니다</p> : null}
    <ul className={styles.list} role={isMultiple ? 'group' : chosen ? 'listbox' : 'menu'} aria-label={label}>
      {found.map(option => {
        const isOn = chosen?.includes(option.value) ?? false;
        return <li key={option.value}>
          <button type="button" className={styles.option} data-size={size} onClick={() => onPick(option.value)}
            role={isMultiple ? 'menuitemcheckbox' : chosen ? 'option' : 'menuitem'}
            aria-checked={isMultiple ? isOn : undefined} aria-selected={!isMultiple && chosen ? isOn : undefined}>
            {isMultiple ? <CheckBox isChecked={isOn} /> : null}
            {option.icon}
            <Text className={styles.optionLabel} maxLines={1} hasTruncateTooltip={false}>{option.label}</Text>
            {!isMultiple && isOn ? icon('check', true) : null}
          </button>
        </li>;
      })}
    </ul>
    {rest > 0 ? <p className={styles.note}>{needle ? `${rest}개 더 있습니다. 검색어를 좁혀 보세요.` : `${rest}개 더 있습니다. 이름으로 찾아보세요.`}</p> : null}
  </VStack>;
}

/** 행 자체가 토글이므로 상자는 그림이다. */
function CheckBox({ isChecked }: { isChecked: boolean }) {
  return <svg className={styles.box} viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-checked={isChecked || undefined}>
    <rect x="1.5" y="1.5" width="13" height="13" rx="4" fill={isChecked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" />
    {isChecked ? <path d="M4.5 8.2l2.3 2.3 4.7-5" fill="none" stroke="var(--color-on-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /> : null}
  </svg>;
}
