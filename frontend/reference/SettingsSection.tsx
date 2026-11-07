import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { List } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';

export function SettingsSection({ title, action, note, children }: { title: string; action?: ReactNode; note?: string; children: ReactNode }) {
  return <VStack as="section" gap={2} aria-label={title}>
    <HStack hAlign="between" vAlign="center" minHeight="1.75rem"><Text type="supporting" weight="medium" color="secondary">{title}</Text>{action}</HStack>
    <Card padding={0}><List hasDividers density="spacious">{children}</List></Card>
    {note ? <Text type="supporting" color="secondary">{note}</Text> : null}
  </VStack>;
}
