import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';
import { CatalogShell } from './CatalogShell';
import { Page } from './Page';

export function LayoutPattern({ layout = 'inset', collapsed = false, notice = false, long = false }: { layout?: 'split' | 'inset'; collapsed?: boolean; notice?: boolean; long?: boolean }) {
  const [draft, setDraft] = useState('');
  return <CatalogShell layout={layout}>
    <Page crumbs={[{ label: '목록' }]} actions={<Button label="새 항목" variant="create" />}
      views={<><Button label="전체" variant="view-active" /><Button label="보관됨" variant="view" /></>}>
      <VStack padding={4} gap={3}>
        <TextInput label="검토 메모" value={draft} onChange={setDraft} />
        {Array.from({ length: long ? 35 : 4 }, (_, index) =>
          <HStack key={index} paddingBlock={3} hAlign="between"><Text>항목 {index + 1}</Text><Text color="secondary">진행 중</Text></HStack>)}
      </VStack>
    </Page>
  </CatalogShell>;
}

