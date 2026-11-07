import { Heading, Text } from '@astryxdesign/core/Text';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';
import { Page, type Crumb } from './Page';

export function SettingsPage({ crumbs, title, description, children }: {
  crumbs: Crumb[]; title: string; description?: string; children: ReactNode;
}) {
  return <Page crumbs={crumbs}>
    <HStack paddingInline={4} paddingBlock={10} hAlign="center">
      <VStack width="100%" maxWidth="45rem" gap={8}>
        <VStack gap={1}><Heading level={1}>{title}</Heading>{description ? <Text color="secondary">{description}</Text> : null}</VStack>
        {children}
      </VStack>
    </HStack>
  </Page>;
}
