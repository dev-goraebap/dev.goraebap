import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import type { ReactNode } from 'react';

export type Crumb = { label: string; href?: string };

export function Page({ crumbs, actions, views, tools, applied, isDetail = false, onBack, mobileAppBar, mobileActions, aboveFooter, footer, notice, children }: {
  crumbs: Crumb[]; actions?: ReactNode; views?: ReactNode; tools?: ReactNode; applied?: ReactNode;
  isDetail?: boolean; onBack?: () => void; mobileAppBar?: ReactNode; mobileActions?: ReactNode; children: ReactNode;
  footer?: ReactNode;
  notice?: ReactNode;
  aboveFooter?: ReactNode;
}) {
  const isPhone = useMediaQuery('(width < 64rem)');
  const shown = isPhone ? crumbs.slice(-1) : crumbs;
  return <VStack className="reference-page">
    {isPhone && !isDetail ? mobileAppBar : null}
    <HStack as="header" className="reference-rule" height="3.25rem" paddingInline={4} gap={3} hAlign="between" vAlign="center">
      <HStack className="reference-crumbs" gap={2} vAlign="center">
        {isPhone && isDetail && onBack ? <Button label="이전으로" variant="ghost" onClick={onBack} /> : null}
        <nav className="reference-crumbs" aria-label="경로">
          {shown.map((crumb, index) => <HStack className="reference-crumb" key={`${crumb.label}-${index}`}>
            {index ? <Text color="secondary" aria-hidden="true">›</Text> : null}
            {crumb.href && index < shown.length - 1 ? <a href={crumb.href}>{crumb.label}</a> : <Text weight="semibold" maxLines={1}>{crumb.label}</Text>}
          </HStack>)}
        </nav>
      </HStack>
      <HStack gap={2} vAlign="center">{views ? null : tools}{actions}</HStack>
    </HStack>
    {notice}
    {views ? <HStack className="reference-rule" height={isPhone ? '3.25rem' : '2.75rem'} paddingInline={4} gap={3} vAlign="center">
      <nav className="reference-views" aria-label="보기">{views}</nav>
      <HStack className="reference-tools" gap={1} vAlign="center">{tools}</HStack>
    </HStack> : null}
    {applied ? <HStack className="reference-applied" paddingInline={4} paddingBlock={2}>{applied}</HStack> : null}
    <VStack className="reference-page-body">{children}</VStack>
    {aboveFooter}
    {footer}
    {isPhone && mobileActions ? <HStack className="reference-actions" padding={4} gap={2}>{mobileActions}</HStack> : null}
  </VStack>;
}
