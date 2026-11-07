import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';
import { ReferenceDialog } from './ReferenceDialog';
import { CatalogShell } from './CatalogShell';
import { Page } from './Page';

export function DialogPattern({ long = false, divider = false, initialOpen = false }: { long?: boolean; divider?: boolean; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return <CatalogShell>
    <Page crumbs={[{ label: '다이얼로그' }]}><VStack padding={4}>
      <Button label="다이얼로그 열기" onClick={() => setOpen(true)} />
    </VStack></Page>
    <ReferenceDialog isOpen={open} onOpenChange={setOpen} title="알림 설정" width="32rem" hasFooterDivider={divider}
      footer={<HStack gap={2} hAlign="end"><Button label="취소" variant="ghost" onClick={() => setOpen(false)} />
        <Button label="저장" onClick={() => setOpen(false)} /></HStack>}>
      <VStack gap={3}>{Array.from({ length: long ? 28 : 1 }, (_, index) =>
        <Text key={index}>프로젝트의 변경 사항을 알림함에서 확인합니다.</Text>)}</VStack>
    </ReferenceDialog>
  </CatalogShell>;
}
