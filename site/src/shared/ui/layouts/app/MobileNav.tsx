import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { createElement, type ReactNode, type MouseEventHandler } from 'react';
import { icon, solarIcon } from '../../foundations/icons/solar-icon';
import { SheetBody } from '../../composites/popup/SheetBody';
import type { NavEntry } from './nav';
import styles from './mobile-nav.module.css';

/**
 * 휴대폰 하단 탭: 엄지가 닿는 아래에 현재 메뉴의 앞 몇 곳과 더보기. 현재 탭과 열린 더보기는 진한 글자와 Bold Duotone.
 * 홈 표시줄을 피한다.
 */
export function MobileTabBar({ tabs, isSelected, isMoreOpen, hasMore, onNavigate, onMore }: {
  tabs: NavEntry[]; isSelected: (path: string) => boolean; isMoreOpen: boolean; hasMore: boolean;
  onNavigate?: (path: string) => void; onMore: () => void;
}) {
  return <nav className={styles.bar} aria-label="주 메뉴">
    {tabs.map(tab => {
      const isCurrent = isSelected(tab.path) || (tab.children ?? []).some(child => isSelected(child.path));
      return <a key={tab.path} className={styles.tab} href={tab.isDisabled ? undefined : tab.path} aria-disabled={tab.isDisabled || undefined} aria-current={isCurrent ? 'page' : undefined}
        onClick={onNavigate && (event => { event.preventDefault(); if(!tab.isDisabled) onNavigate(tab.path); })}>
        {createElement(solarIcon(tab.icon ?? 'document', isCurrent), { className: styles.icon })}
        <small>{tab.label}</small>
      </a>;
    })}
    {hasMore ? <button type="button" className={styles.tab} aria-haspopup="dialog" aria-expanded={isMoreOpen} onClick={onMore}>
      {createElement(solarIcon('more', isMoreOpen), { className: styles.icon })}
      <small>더보기</small>
    </button> : null}
  </nav>;
}

/**
 * 더보기 시트: 탭에 없는 목적지. 하위 목적지는 상위 항목 아래 묶음으로 두고 묶음 사이를 선으로 나눈다. 하위 공간이면 그 이름을
 * 제목으로, 돌아가기를 앞에 둔다.
 */
export function MobileMenuSheet({ isOpen, onOpenChange, entries, isSelected, onSelect, back, tools }: {
  isOpen: boolean; onOpenChange: (isOpen: boolean) => void; entries: NavEntry[];
  isSelected: (path: string) => boolean; onSelect: (path: string) => MouseEventHandler | undefined;
  back?: { path: string; label: string; title: string };
  tools?: ReactNode;
}) {
  const title = back?.title ?? '더보기';
  // 하위 항목은 상위 아이콘 뒤 글자 시작선에 맞춰 들인다(사이드바와 같은 위계).
  const row = (entry: NavEntry, isIndented = false) => {
    const isCurrent = isSelected(entry.path);
    return <a href={entry.isDisabled ? undefined : entry.path} aria-disabled={entry.isDisabled || undefined} onClick={entry.isDisabled ? e=>e.preventDefault() : onSelect(entry.path)} className={styles.link} data-indented={isIndented || undefined}
      aria-current={isCurrent ? 'page' : undefined}>
      {entry.icon ? icon(entry.icon, isCurrent) : null}
      <Text className={styles.label} maxLines={1}>{entry.label}</Text>
    </a>;
  };
  return <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange} label={title} height="hug">
    <SheetBody>
      <HStack className={styles.header} gap={2} vAlign="center">
        {back ? <IconButton label={back.label} href={back.path} onClick={onSelect(back.path)} variant="ghost" size="sm" icon={icon('back')} /> : null}
        <Text className={styles.label} weight="semibold" maxLines={1}>{title}</Text>
        <IconButton label="메뉴 닫기" variant="ghost" size="sm" icon={icon('close')} onClick={() => onOpenChange(false)} />
      </HStack>
      {entries.length ? <nav aria-label={title}><ul className={styles.menu}>{entries.map(entry => {
        const children = entry.children ?? [];
        return <li key={entry.path} className={children.length ? styles.group : undefined}>
          {row(entry)}
          {children.length ? <ul className={styles.menu}>{children.map(child =>
            <li key={child.path}>{row(child, !!entry.icon)}</li>)}</ul> : null}
        </li>;
      })}</ul></nav> : null}
      {tools ? <HStack gap={2} vAlign="center">{tools}</HStack> : null}
    </SheetBody>
  </BottomSheet>;
}
