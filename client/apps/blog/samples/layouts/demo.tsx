import type { NavSpace } from "@/shared/ui/kit/layout/app-shell";
import { BellIcon, CalendarIcon, FileTextIcon, FolderIcon, InboxIcon, LibraryIcon, ListIcon, ProjectsIcon, SearchIcon, SettingsIcon, UserIcon, UsersIcon, type Icon } from "@/shared/ui/kit/icon";
import type { NavSection } from "@/shared/ui/kit/layout/app-shell";

/** 레이아웃 견본이 쓰는 중립 메뉴. 지금 항목은 셸이 라우터의 주소로 정한다(견본은 메모리 라우터를 쓴다). */
export const demoSpace: NavSpace = {
  id: "main", title: "작업 공간", sections: [
    { title: "작업", isHeaderHidden: true, entries: [
      { path: "/inbox", label: "받은 항목", icon: InboxIcon, badge: 3 },
      { path: "/items", label: "모든 항목", icon: ListIcon },
      { path: "/calendar", label: "일정", icon: CalendarIcon },
    ] },
    { title: "모음", entries: [
      { path: "/folders/a", label: "디자인 참고", icon: FolderIcon },
      { path: "/folders/b", label: "개발 자료", icon: FolderIcon },
    ] },
    { title: "설정", entries: [{ path: "/settings", label: "설정", icon: SettingsIcon }] },
  ],
};

/**
 * 공간이 둘인 앱의 메뉴. 주소의 첫 마디가 공간이다(/work/… · /library/…). 맨 위 이름표 없는 묶음(찾기 · 알림함 · 내 항목)은
 * 어느 공간에서나 같고, 눌러도 공간을 바꾸지 않는다.
 */
export const globalSection = (onSearch: () => void): NavSection => ({ title: "전역", isHeaderHidden: true, entries: [
  { path: "/search", label: "찾기", icon: SearchIcon, onSelect: onSearch, isPhoneHidden: true },
  { path: "/notifications", label: "알림함", icon: BellIcon, badge: 2 },
  { path: "/mine", label: "내 항목", icon: UserIcon },
] });

export type DemoSpace = { id: "work" | "library"; label: string; icon: Icon; sections: NavSection[]; admin: { path: string; label: string } };

export const demoSpaces: DemoSpace[] = [
  { id: "work", label: "작업", icon: ProjectsIcon, admin: { path: "/work/admin", label: "작업 공간 관리" }, sections: [
    { title: "작업", entries: [
      { path: "/work/items", label: "모든 항목", icon: ListIcon },
      { path: "/work/calendar", label: "일정", icon: CalendarIcon },
      { path: "/work/people", label: "구성원", icon: UsersIcon },
    ] },
  ] },
  { id: "library", label: "자료", icon: LibraryIcon, admin: { path: "/library/admin", label: "자료실 관리" }, sections: [
    { title: "자료", entries: [
      { path: "/library/docs", label: "문서", icon: FileTextIcon },
      { path: "/library/folders", label: "폴더", icon: FolderIcon },
    ] },
  ] },
];

/** 사이드바 머리의 표시. 접힌 사이드바에는 심벌만 남긴다. */
export function DemoBrand({ isFolded }: { isFolded: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <LibraryIcon chosen className="size-5 shrink-0" />
      {!isFolded && <span className="truncate font-semibold">작업 공간</span>}
    </span>
  );
}

export const rows = ["읽기 편한 화면의 글자 리듬", "주소에 남겨야 하는 화면 상태", "기다리는 시간을 설계하는 방법", "키보드로 끝까지 쓸 수 있는 화면",
  "서버 데이터와 화면 상태의 경계", "오래 쓰는 도구에 관한 메모", "차분한 공간에서 찾은 색과 형태", "페이지에서 시작하는 프론트엔드 구조"];
