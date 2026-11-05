import { AppShell } from '@astryxdesign/core/AppShell';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useState, type ReactNode } from 'react';

export function WorkspaceShell({ sideNav, mobileTabs, footer, layout = 'inset', isDetail = false, children }: {
  sideNav: ReactNode; mobileTabs?: ReactNode; footer?: ReactNode; layout?: 'inset' | 'split'; isDetail?: boolean; children: ReactNode;
}) {
  const isPhone = useMediaQuery('(width < 64rem)');
  const [isMenuOpen, setMenuOpen] = useState(false);
  if (isPhone) return <AppShell variant="surface" sideNav={sideNav} mobileNav={{ breakpoint: 'lg', hasToggle: false, isOpen: isMenuOpen, onOpenChange: setMenuOpen }}>
    <VStack height="100%">
      <VStack className="reference-shell-body">{children}</VStack>
      {!isDetail ? <HStack as="nav" className="reference-rule" padding={2} gap={2} hAlign="between" aria-label="주 탐색">
        {mobileTabs}<Button label="더보기" variant="ghost" onClick={() => setMenuOpen(true)} />
      </HStack> : null}
    </VStack>
  </AppShell>;
  return <AppShell variant={layout === 'split' ? 'section' : 'wash'} sideNav={sideNav}>
    <VStack height="100%" paddingBlockStart={layout === 'inset' ? 2 : 0} paddingInlineEnd={layout === 'inset' ? 2 : 0}>
      {layout === 'inset'
        ? <Card className="reference-shell-body" variant="page" padding={0} elevation="low">{children}</Card>
        : <VStack className="reference-shell-body">{children}</VStack>}
      {footer}
    </VStack>
  </AppShell>;
}
