import { Button } from '@astryxdesign/core/Button';
import { Dialog, type DialogProps } from '@astryxdesign/core/Dialog';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { useId, type ReactNode } from 'react';

/** Shared header, scrollable body and optional footer for a project to adopt. */
export function ReferenceDialog({ title, children, footer, actions, hasFooterDivider = false, notice, ...props }: {
  title: string; children: ReactNode; footer?: ReactNode; actions?: ReactNode; hasFooterDivider?: boolean; notice?: ReactNode;
} & Omit<DialogProps, 'title' | 'children' | 'padding' | 'position'>) {
  const titleId = useId();
  return <Dialog {...props} padding={0} aria-labelledby={titleId}
    className="reference-dialog" maxHeight="calc(100dvh - 2 * var(--reference-dialog-edge))">
    <VStack className="reference-dialog-frame">
      <HStack as="header" className="reference-dialog-header" data-dialog-region="header" gap={3} vAlign="center">
        <Heading className="reference-dialog-heading" level={2} id={titleId} tabIndex={-1} data-autofocus>{title}</Heading>
        {actions}
        <Button label="닫기" tooltip="닫기" isIconOnly icon={<svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>} variant="ghost" size="sm" onClick={() => props.onOpenChange(false)} />
      </HStack>
      {notice}
      <VStack className="reference-dialog-body" data-dialog-region="body" isScrollable>{children}</VStack>
      {footer ? <VStack as="footer" className="reference-dialog-footer" data-dialog-region="footer" data-divider={hasFooterDivider || undefined}>{footer}</VStack> : null}
    </VStack>
  </Dialog>;
}
