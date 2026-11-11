import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Layout, LayoutContent, LayoutPanel } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { useIsPhone } from '../../foundations/media';
import { SheetBody } from '../../composites/popup/SheetBody';
import styles from './side-panel.module.css';

/**
 * 목록 옆에서 행 하나의 사실을 보는 패널(주소가 필요 없는 짧은 조회). 데스크톱은 오른쪽 패널(제목·부제·닫기), 휴대폰은
 * 아래에서 올라오는 시트. 패널이 없으면 목록만. 편집·긴 내용은 자기 주소를 가진 상세로 연다.
 */
export function WithPanel({ title, subtitle, panel, width = '26rem', footer, onClose, children }: {
  title?: string; subtitle?: string; panel?: ReactNode; width?: string; footer?: ReactNode; onClose: () => void; children: ReactNode;
}) {
  const isPhone = useIsPhone();
  const body = panel ? <VStack gap={4}>
    <HStack hAlign="between" vAlign="start" gap={2}>
      <VStack gap={0}><Text weight="semibold">{title}</Text>{subtitle ? <Text type="supporting" color="secondary">{subtitle}</Text> : null}</VStack>
      <IconButton label="닫기" tooltip="닫기" variant="ghost" size="sm" icon={icon('close')} onClick={onClose} />
    </HStack>
    {panel}
    {footer}
  </VStack> : null;
  if (isPhone) return (
    <>
      {children}
      <BottomSheet
        isOpen={!!panel}
        onOpenChange={isOpen => { if (!isOpen) onClose(); }}
        label={title ?? '자세히'}
        height="capped"
        padding={0}>
        <SheetBody>{body}</SheetBody>
      </BottomSheet>
    </>
  );
  return <Layout height="fill" content={<LayoutContent padding={0}>{children}</LayoutContent>}
    end={body ? <LayoutPanel hasDivider width={width} padding={4} label={title ?? '자세히'}>{body}</LayoutPanel> : undefined} />;
}

/** 이름과 값의 사실 목록: 데스크톱 두 열, 휴대폰은 이름 아래 값. */
export function Facts({ facts }: { facts: [string, ReactNode][] }) {
  return <dl className={styles.facts}>{facts.map(([label, value]) => <div key={label} className={styles.fact}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
