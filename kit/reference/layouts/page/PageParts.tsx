import { Banner, type BannerProps } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { List, type ListProps } from '@astryxdesign/core/List';
import { Table, type TablePlugin, type TableProps } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageBannerContext, PageFootContext } from './page-context';
import styles from './page.module.css';

/**
 * 페이지 전체의 상태·오류·성공을 머리 아래, 툴바 위의 공용 줄에 알린다. 안내가 없으면 줄도 없다. 필드 오류는 입력 곁에,
 * 대화상자 안의 오류는 대화상자 안에 둔다.
 */
export function PageBanner(props: Omit<BannerProps, 'container' | 'collapsible'>) {
  const slot = useContext(PageBannerContext);
  return slot ? createPortal(<Banner {...props} container="section" collapsible={false} />, slot) : <Banner {...props} container="section" collapsible={false} />;
}

/**
 * 양식의 동작(취소·이전·제출): 데스크톱은 양식 끝, 휴대폰 상세는 바닥 고정 줄에 두고 마지막(양식 자체의 동작)이 남은
 * 폭을 차지한다. start는 데스크톱 줄의 왼쪽, 휴대폰 줄의 처음.
 */
export function PageActions({ start, children }: { start?: ReactNode; children: ReactNode }) {
  const foot = useContext(PageFootContext);
  if (foot) return createPortal(<HStack className={styles.footActions} gap={2} vAlign="center">{start}{children}</HStack>, foot);
  return <HStack gap={2} hAlign={start ? 'between' : 'end'} vAlign="center" wrap="wrap">
    {start}
    <HStack gap={2} vAlign="center" wrap="wrap">{children}</HStack>
  </HStack>;
}

/** 페이지 목록·표의 행 높이. 앱 설정 한 곳에서 정하고 모든 페이지 목록이 따른다. 메뉴·대화상자 안의 목록은 자기 크기. */
export type Density = 'comfortable' | 'compact';
export const DensityContext = createContext<Density>('comfortable');

/**
 * 페이지의 목록: 앱의 밀도, 페이지 면 바탕(점 무늬 위에서 불투명), 행이 있으면 마지막 줄 아래 구분선. 행 전체가 첫 링크로
 * 열리고(늘린 링크) 끝 칸의 버튼·링크·프로필은 따로 누른다. 화면 이동은 ListItem의 href로만 한다(href가 있으면 onClick은 무시된다).
 */
export function PageList(props: Omit<ListProps, 'density'>) {
  const density = useContext(DensityContext);
  return <List {...props} className={[styles.data, styles.rowLinks, props.hasDividers && styles.listEnd, props.className].filter(Boolean).join(' ')}
    density={density === 'compact' ? 'compact' : 'spacious'} />;
}

export function PageTable<T extends Record<string, unknown>>(props: Omit<TableProps<T>, 'density'>) {
  const density = useContext(DensityContext);
  return <Table<T> {...props} className={[styles.data, styles.tableEnd, props.className].filter(Boolean).join(' ')}
    density={density === 'compact' ? 'compact' : 'spacious'} />;
}

/**
 * 표의 행을 눌러 대상을 연다. 행 안의 링크·버튼·입력·체크를 누른 것은 열지 않는다. 키보드 사용자는 제목 칸의 링크로 연다.
 */
export function useOpenRows<T extends Record<string, unknown>>(onOpen?: (row: T) => void): Record<string, TablePlugin<T>> {
  return useMemo((): Record<string, TablePlugin<T>> => {
    if (!onOpen) return {};
    return {
      open: {
        transformBodyRow: (props, row) => ({
          ...props,
          htmlProps: {
            ...props.htmlProps,
            className: [props.htmlProps.className, styles.openRow].filter(Boolean).join(' '),
            onClick: event => {
              if (event.defaultPrevented || (event.target instanceof Element
                && event.target.closest('a[href], button, input, select, textarea, label, [role="button"], [role="link"], [role="checkbox"]'))) return;
              props.htmlProps.onClick?.(event);
              if (!event.defaultPrevented) onOpen(row);
            },
          },
        }),
      },
    };
  }, [onOpen]);
}

/** 조각씩 읽는 목록 아래: 전체 중 읽은 수(전체를 모르면 현재 수)와, 남았으면 더 보기. */
export function PageMore({ shown, total, unit, hasMore, isLoading, onMore }: {
  shown: number; total?: number; unit: string; hasMore: boolean; isLoading: boolean; onMore: () => void;
}) {
  return <HStack hAlign="center" gap={3} vAlign="center" padding={4}>
    <Text type="supporting" color="secondary" hasTabularNumbers role="status">{total === undefined ? `현재 ${shown}${unit}` : `${total}${unit} 중 ${shown}${unit}`}</Text>
    {hasMore ? <Button label="더 보기" variant="secondary" size="sm" isLoading={isLoading} onClick={onMore} /> : null}
  </HStack>;
}
