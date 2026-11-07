import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { SideNav, SideNavItem } from '@astryxdesign/core/SideNav';
import { Text } from '@astryxdesign/core/Text';
import type { ReactNode } from 'react';
import { WorkspaceShell } from './WorkspaceShell';

export function CatalogShell({ children, layout = 'inset', isDetail = false }: {
  children: ReactNode; layout?: 'inset' | 'split'; isDetail?: boolean;
}) {
  return <WorkspaceShell layout={layout} isDetail={isDetail}
    sideNav={<SideNav header={<HStack padding={4}><Text weight="semibold">애플리케이션</Text></HStack>}>
      <SideNavItem label="목록" isSelected /><SideNavItem label="설정" />
    </SideNav>}
    mobileTabs={<><Button label="목록" variant="ghost" /><Button label="설정" variant="ghost" /></>}
    footer={<HStack padding={2}><Text type="supporting" color="secondary">v1.0.0</Text></HStack>}>
    {children}
  </WorkspaceShell>;
}
