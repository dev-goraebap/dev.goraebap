import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { List } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';
import { Page, type PageTopProps } from '../page/Page';
import styles from './settings.module.css';

/**
 * 값과 정책을 정하는 화면. 같은 페이지 머리 아래 최대 45rem 가운데 열(위아래 40px): 제목, 필요할 때만 설명, 구역들.
 * 페이지 본문이 자기 h1을 가지므로 머리 줄의 숨은 제목은 두지 않는다.
 */
export function SettingsPage({ title, description, children, ...top }: Omit<PageTopProps, 'hasHeading'> & {
  title: string; description?: string; children: ReactNode;
}) {
  return <Page {...top} hasHeading={false}>
    <HStack hAlign="center" paddingInline={4} paddingBlock={10}>
      <VStack className={styles.column} width="100%" maxWidth="45rem" gap={8}>
        <VStack gap={1}><Heading level={1}>{title}</Heading>{description ? <Text color="secondary">{description}</Text> : null}</VStack>
        {children}
      </VStack>
    </HStack>
  </Page>;
}

/** 구역: 작은 이름과 구역 동작, 올린 면 안의 값 목록, 필요할 때만 아래 안내. 카드 마지막 구분선은 테두리와 겹치지 않는다. */
export function SettingsSection({ title, action, note, children }: { title: string; action?: ReactNode; note?: ReactNode; children: ReactNode }) {
  return <VStack as="section" gap={2} aria-label={title}>
    <HStack hAlign="between" vAlign="center" minHeight="1.75rem"><Text type="supporting" weight="medium" color="secondary">{title}</Text>{action}</HStack>
    <Card padding={0}><List hasDividers density="spacious">{children}</List></Card>
    {note ? <Text type="supporting" color="secondary">{note}</Text> : null}
  </VStack>;
}

/** 이름·설명과 값·입력의 두 열. 좁은 열(32rem 이하)에서는 이름 아래에 값을 둔다. */
export function SettingsField({ label, description, isValue = false, children }: {
  label: string; description?: ReactNode; isValue?: boolean; children: ReactNode;
}) {
  return <VStack className={styles.field}>
    <VStack gap={1} className={styles.label}>
      <Text weight="medium">{label}</Text>
      {description ? <Text type="supporting" color="secondary">{description}</Text> : null}
    </VStack>
    <VStack className={styles.control} data-value={isValue || undefined}>{children}</VStack>
  </VStack>;
}
