import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { CatalogShell } from './CatalogShell';
import { CreationForm, CreationSurface } from './CreationForm';
import { Page } from './Page';
import { RichTextBody } from './RichTextBody';

export function CreationPattern({ stepped = false, surface = 'dialog', initialOpen = true }: { stepped?: boolean; surface?: 'dialog' | 'page'; initialOpen?: boolean }) {
  const isPhone = useMediaQuery('(width < 64rem)');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState<JSONContent>();
  const [category, setCategory] = useState(false);
  const [open, setOpen] = useState(initialOpen);
  const [step, setStep] = useState(0);
  return <CatalogShell isDetail={open}>
    {surface === 'dialog' && !isPhone || !open ? <Page crumbs={[{ label: '목록' }]}
      actions={<Button label="새 항목" variant="create" onClick={() => setOpen(true)} />}>
      <VStack padding={4}><Text>새 항목를 작성합니다.</Text></VStack>
    </Page> : null}
    {open ? <CreationSurface surface={surface} close={() => setOpen(false)} submit={() => setOpen(false)}
      disabled={!title.trim() || !category || stepped && step !== 1}>
      <CreationForm title={title} onTitle={setTitle}
        steps={stepped ? <HStack gap={2}><Button label="1. 내용 작성" variant="secondary" onClick={() => setStep(0)} />
          <Button label="2. 확인" variant="secondary" onClick={() => setStep(1)} /></HStack> : undefined}
        body={stepped && step === 1 ? <Text>{title || '제목을 입력해 주세요'}</Text> : <RichTextBody value={body} onChange={setBody} />}
        properties={<Button label={category ? '분류 · 기본' : '분류 (필수)'} variant="view"
          onClick={() => setCategory(!category)} />} />
    </CreationSurface> : null}
  </CatalogShell>;
}

