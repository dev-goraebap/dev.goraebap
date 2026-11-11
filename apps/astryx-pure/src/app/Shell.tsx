import { AppShell } from '@astryxdesign/core/AppShell';
import { Card } from '@astryxdesign/core/Card';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { NavIcon } from '@astryxdesign/core/NavIcon';
import { SideNav, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TopNav } from '@astryxdesign/core/TopNav';
import { BellIcon, MagnifyingGlassIcon, SparklesIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { menu, settingsEntry } from './menu';

// Core 템플릿 shell-side-nav의 사이드바와 shell-nav의 위쪽 막대를 함께 쓴다. 셸은 wash 바탕 하나로 두고, 콘텐츠는 테두리 있는 Card에 담아 띄운다.
export function Shell() {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const [query, setQuery] = useState('');
  // 좁은 화면에서는 고정 너비 검색 칸이 앱 이름을 덮으므로 아이콘 버튼으로 바꾼다(Core 템플릿과 같은 768px 기준).
  const isNarrow = useMediaQuery('(max-width: 768px)');
  return (
    <AppShell
      variant="wash"
      contentPadding={2}
      topNav={
        <TopNav
          label="상단 메뉴"
          heading={
            <HStack gap={2} vAlign="center">
              <NavIcon icon={<Icon icon={SparklesIcon} size="sm" />} />
              <Text type="label" weight="semibold">Astryx Pure</Text>
            </HStack>
          }
          endContent={
            <>
              {isNarrow
                ? <IconButton label="검색" tooltip="검색" variant="ghost" icon={<Icon icon={MagnifyingGlassIcon} size="sm" />} />
                : <TextInput label="검색" isLabelHidden size="sm" width={240} startIcon={MagnifyingGlassIcon} placeholder="검색" value={query} onChange={setQuery} />}
              <IconButton label="알림" tooltip="알림" variant="ghost" icon={<Icon icon={BellIcon} size="sm" />} />
              <IconButton label="계정" tooltip="계정" variant="ghost" icon={<Icon icon={UserCircleIcon} size="sm" />} />
            </>
          }
        />
      }
      sideNav={
        <SideNav
          collapsible
          resizable={{ defaultWidth: 260, minWidth: 200, maxWidth: 400 }}
          footer={
            <SideNavSection title="계정" isHeaderHidden>
              <SideNavItem label={settingsEntry.label} icon={settingsEntry.icon} href={settingsEntry.path} isSelected={pathname === settingsEntry.path} />
            </SideNavSection>
          }>
          <SideNavSection title="메뉴" isHeaderHidden>
            {menu.map(entry => <SideNavItem key={entry.path} label={entry.label} icon={entry.icon} href={entry.path} isSelected={pathname === entry.path} />)}
          </SideNavSection>
        </SideNav>
      }>
      {/* 둥근 모서리와 테두리가 함께 있는 콘텐츠 면: AppShell에는 그런 모양이 없어 Card로 감싼다. 바탕(wash) 위에 8px 띄운다. */}
      <Card padding={0} height="100%">
        <Outlet />
      </Card>
    </AppShell>
  );
}
