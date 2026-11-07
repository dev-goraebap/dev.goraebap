import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { createElement, type ReactNode } from 'react';
import { solarIcon } from '../../foundations/icons/solar-icon';
import { useIsPhone } from '../../foundations/media';
import styles from './list-group.module.css';

/**
 * 그룹 목록의 머리 띠: 꺾쇠·표시·이름·개수와 선택적인 그룹 동작. 페이지 스크롤에 붙어 행이 그 아래로 지나간다.
 * 접기 상태는 화면 상태이며 조회 조건이 아니다.
 */
export function ListGroupHeader({ label, count, mark, isOpen, onToggle, actions }: {
  label: string; count: number; mark?: ReactNode; isOpen: boolean; onToggle: () => void; actions?: ReactNode;
}) {
  const isPhone = useIsPhone();
  const chevron = createElement(solarIcon('chevron-down'), { className: isOpen ? styles.chevron : `${styles.chevron} ${styles.closed}` });
  return <HStack as="header" className={styles.head} height={isPhone ? '2.5rem' : '2.25rem'} paddingInline={2} gap={2} vAlign="center" hAlign="between">
    <Button label={`${label} ${count}개`} variant="ghost" size="sm" icon={chevron} aria-expanded={isOpen} onClick={onToggle}>
      <HStack gap={2} vAlign="center">{mark}<Text weight="medium">{label}</Text><Text color="secondary" hasTabularNumbers>{count}</Text></HStack>
    </Button>
    {actions}
  </HStack>;
}
