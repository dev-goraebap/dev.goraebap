import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { icon } from "@kit/foundations/icons/solar-icon";
import type { NavSpace } from "@kit/layouts/app/nav";

/** 레이아웃 견본이 쓰는 중립 메뉴. 실제 앱은 라우터의 주소로 현재 항목을 정한다. */
export const demoSpace: NavSpace = {
  id: "main", title: "작업 공간", sections: [
    { title: "작업", isHeaderHidden: true, entries: [
      { path: "/inbox", label: "받은 항목", icon: "inbox", badge: 3 },
      { path: "/items", label: "모든 항목", icon: "layout-list" },
      { path: "/calendar", label: "일정", icon: "calendar" },
    ] },
    { title: "모음", entries: [
      { path: "/folders/a", label: "디자인 참고", icon: "folder" },
      { path: "/folders/b", label: "개발 자료", icon: "folder" },
    ] },
    { title: "설정", entries: [{ path: "/settings", label: "설정", icon: "settings" }] },
  ],
};

export const demoAccount: NavSpace = {
  id: "account", title: "내 계정", back: { label: "돌아가기", path: "/items" }, sections: [
    { title: "내 계정", isHeaderHidden: true, entries: [
      { path: "/account", label: "내 정보", icon: "user" },
      { path: "/account/display", label: "화면 설정", icon: "computer" },
    ] },
  ],
};

export function DemoBrand({ isFolded }: { isFolded: boolean }) {
  return <HStack gap={2} vAlign="center">{icon("library", true)}{isFolded ? null : <Text weight="semibold">작업 공간</Text>}</HStack>;
}

export const rows = ["읽기 편한 화면의 글자 리듬", "주소에 남겨야 하는 화면 상태", "기다리는 시간을 설계하는 방법", "키보드로 끝까지 쓸 수 있는 화면",
  "서버 데이터와 화면 상태의 경계", "오래 쓰는 도구에 관한 메모", "차분한 공간에서 찾은 색과 형태", "페이지에서 시작하는 프론트엔드 구조"];
