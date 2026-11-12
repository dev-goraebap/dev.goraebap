import type { NavSpace } from "@/shared/ui/app-shell";
import { CalendarIcon, FolderIcon, InboxIcon, LibraryIcon, ListIcon, MonitorIcon, SettingsIcon, UserIcon } from "@/shared/ui/icon";

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

export const demoAccount: NavSpace = {
  id: "account", title: "내 계정", back: { label: "돌아가기", path: "/items" }, sections: [
    { title: "내 계정", isHeaderHidden: true, entries: [
      { path: "/account", label: "내 정보", icon: UserIcon },
      { path: "/account/display", label: "화면 설정", icon: MonitorIcon },
    ] },
  ],
};

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
