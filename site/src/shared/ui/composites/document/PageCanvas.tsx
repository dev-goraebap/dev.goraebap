import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { CSSProperties, ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { MM, fillPageTokens, formatOf, printPageRule, type PageLook, type PageSetup } from './model';
import type { PageLayout } from './pagination';
import styles from './document.module.css';

export type PageArea = 'header' | 'footer';

/**
 * 페이지 보기의 종이 틀. 페이지 수만큼 종이를 본문 뒤에 깔고, 위·아래 여백에 머리말·바닥글({page}·{total}을 채운다)을 둔다.
 * 본문은 첫 페이지의 여백 안에서 시작하고, 페이지 나누기 확장(Pagination)이 페이지 끝을 넘는 블록을 다음 종이의 여백 안으로 민다.
 * 좁은 칸에서는 zoom으로 종이를 줄인다(나눔은 배율과 관계없다). 종이 크기는 rem이라 큰 화면이 기준 글자를 키우면 글과 함께 커진다.
 * onEditArea가 있으면 머리말·바닥글 자리를 두 번 눌러 고칠 수 있다(편집기가 설정 칸을 연다). 인쇄는 같은 설정의 @page 규칙을 쓴다.
 */
export function PageCanvas({ setup, layout, zoom = 1, look, onEditArea, activeArea, children }: {
  setup: PageSetup; layout: PageLayout | null; zoom?: number; look?: PageLook; onEditArea?: (area: PageArea) => void;
  /** 지금 설정 칸에서 고치는 영역: 경계 점선과 표시를 늘 보인다. */
  activeArea?: PageArea | null; children: ReactNode;
}) {
  const format = formatOf(setup);
  const count = layout?.count ?? 1, stride = format.height + format.gap;
  const rem = (px: number) => `${px / 16}rem`;
  const style = {
    zoom, '--pg-width': rem(format.width), '--pg-height': rem(format.height), '--pg-total': rem(count * stride - format.gap),
    '--pg-margin-top': rem(format.marginTop), '--pg-margin-bottom': rem(format.marginBottom),
    '--pg-margin-left': rem(format.marginLeft), '--pg-margin-right': rem(format.marginRight),
    '--pg-gap': rem(format.gap), '--pg-header-distance': rem(setup.headerDistance * MM), '--pg-footer-distance': rem(setup.footerDistance * MM),
  } as CSSProperties;
  // 머리말·바닥글 영역: 종이 위·아래 여백 전체. 고칠 수 있으면 올렸을 때 본문과의 경계를 점선으로, 끝에 연필 단추를 보인다(두 번 눌러도 연다).
  const area = (kind: PageArea, number: number, parts: string[]) => {
    const isEmpty = !parts.some(Boolean);
    if (isEmpty && !onEditArea) return null;
    const name = kind === 'header' ? '머리말' : '바닥글';
    return <HStack className={kind === 'header' ? styles.pageHeader : styles.pageFooter} data-empty={isEmpty || undefined}
      data-editable={onEditArea ? '' : undefined} data-active={activeArea === kind || undefined} aria-label={onEditArea ? name : undefined}
      aria-hidden={!onEditArea || undefined} hAlign="between" gap={3} onDoubleClick={onEditArea ? () => onEditArea(kind) : undefined}>
      {isEmpty ? <Text className={styles.pageAreaPlaceholder}>{`${name} 추가`}</Text>
        : parts.map((part, index) => <Text key={index} className={styles.pageAreaText} data-align={['start', 'center', 'end'][parts.length === 2 ? index * 2 : index]}>
          {fillPageTokens(part, number, count)}
        </Text>)}
      {onEditArea ? <Button label={`${name} 고치기`} tooltip={`${name} 고치기`} variant="secondary" size="sm" isIconOnly icon={icon('edit')}
        className={styles.pageAreaEdit} onClick={() => onEditArea(kind)} /> : null}
    </HStack>;
  };
  return <VStack className={styles.canvas} style={style} data-page-count={count} data-look={look?.style ?? 'tinted'} data-line={look?.line ?? 'solid'}>
    <style>{printPageRule(setup)}</style>
    <VStack className={styles.sheets}>
      {Array.from({ length: count }, (_, index) => {
        const number = index + 1, isBare = setup.differentFirstPage && number === 1;
        return <VStack key={index} className={styles.sheet} data-sheet={number} style={{ insetBlockStart: rem(index * stride) }}>
          {isBare ? null : area('header', number, [setup.header.left, setup.header.right])}
          {isBare ? null : area('footer', number, [setup.footer.left, setup.footer.center, setup.footer.right])}
          {/* 구분선 모양: 페이지 사이 틈 가운데의 가로선(마지막 페이지 뒤에는 없다). */}
          {look?.style === 'divider' && number < count ? <VStack className={styles.pageDivider} aria-hidden /> : null}
        </VStack>;
      })}
    </VStack>
    {children}
  </VStack>;
}
