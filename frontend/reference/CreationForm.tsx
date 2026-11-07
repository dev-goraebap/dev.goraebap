import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Page } from './Page';
import { ReferenceDialog } from './ReferenceDialog';

const PropertiesSlot = createContext<HTMLElement | null>(null);

export function CreationForm({ title, onTitle, body, properties, steps }: {
  title: string; onTitle: (title: string) => void; body: ReactNode; properties: ReactNode; steps?: ReactNode;
}) {
  const slot = useContext(PropertiesSlot);
  const pills = <HStack className="reference-creation-properties" gap={2} wrap="wrap">{properties}</HStack>;
  return <VStack className="reference-creation-form" gap={3}>
    {steps}
    <input className="reference-creation-title" aria-label="제목" placeholder="제목" value={title}
      onChange={event => onTitle(event.target.value)} />
    {body}
    {slot ? createPortal(pills, slot) : pills}
  </VStack>;
}

export function CreationSurface({ surface, children, close, expand, submit, disabled, title = '새 항목' }: {
  surface: 'dialog' | 'page'; title?: string; children: ReactNode; close: () => void; expand?: () => void;
  submit: () => void; disabled?: boolean;
}) {
  const isPhone = useMediaQuery('(width < 64rem)');
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const footer = <HStack hAlign="end" gap={2}>
    <Button label="취소" variant="ghost" onClick={close} />
    <Button label="만들기" isDisabled={disabled} onClick={submit} />
  </HStack>;
  if (isPhone || surface === 'page') return <PropertiesSlot value={isPhone ? slot : null}><Page crumbs={[{ label: title }]} isDetail onBack={close}
    aboveFooter={isPhone ? <HStack ref={setSlot} className="reference-creation-dock" /> : undefined}
    footer={<HStack className="reference-actions" padding={4} hAlign="end">{footer}</HStack>}>
    <VStack padding={4} gap={4}>{children}</VStack>
  </Page></PropertiesSlot>;
  return <ReferenceDialog isOpen onOpenChange={open => { if (!open) close(); }} title={title} width="45rem" footer={footer}
    actions={expand ? <Button label="크게 보기" variant="ghost" onClick={expand} /> : undefined}>
    {children}
  </ReferenceDialog>;
}
