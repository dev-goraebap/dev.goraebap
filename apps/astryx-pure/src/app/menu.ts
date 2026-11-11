import { Cog6ToothIcon, InboxIcon, TableCellsIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

/** 사이드바 메뉴와 라우트가 함께 읽는 목록. 페이지는 모두 Astryx Core 템플릿 그대로다. */
export const menu = [
  { path: '/inbox', label: '받은함', icon: InboxIcon },
  { path: '/table', label: '모든 항목', icon: TableCellsIcon },
  { path: '/board', label: '보드', icon: ViewColumnsIcon },
] as const;
export const settingsEntry = { path: '/settings', label: '설정', icon: Cog6ToothIcon } as const;
