import type { SystemIconName } from "@goraebap/ui-react/icons";

// 헤더 메뉴. 어느 페이지에서나 같고, 글이 없는 메뉴(to가 없는 것)는 보이지 않는다(ADR 0008).
// match는 그 메뉴에 속한 주소의 앞부분이다.
type SiteMenuTarget =
  | "/reference/frontend"
  | "/design-system/overview"
  | "/backend/engineering";

export interface SiteMenu {
  label: string;
  icon: SystemIconName;
  description: string;
  to?: SiteMenuTarget;
  match: string[];
  // 메뉴 아래 줄에 보이는 하위 메뉴
  children?: { label: string; to: SiteMenuTarget; match: string[] }[];
}

export const SITE_MENUS: SiteMenu[] = [
  {
    label: "Playbooks",
    icon: "details",
    description: "목표 하나를 이루는 순서",
    match: ["/playbooks"],
  },
  {
    label: "Blog",
    icon: "details",
    description: "왜 이렇게 하는지에 대한 글",
    match: ["/blog"],
  },
  {
    label: "Reference",
    icon: "code",
    description: "프론트엔드·백엔드 구현 기준",
    to: "/reference/frontend",
    match: ["/reference", "/frontend/glossary", "/backend"],
    children: [
      { label: "Frontend", to: "/reference/frontend", match: ["/reference/frontend"] },
      { label: "Backend", to: "/backend/engineering", match: ["/backend"] },
    ],
  },
  {
    label: "Design System",
    icon: "components",
    description: "파운데이션·컴포넌트·레이아웃·패턴",
    to: "/design-system/overview",
    match: ["/design-system"],
  },
];

export const VISIBLE_MENUS = SITE_MENUS.filter(
  (menu): menu is SiteMenu & { to: SiteMenuTarget } => menu.to !== undefined,
);

export const isUnder = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const activeMenu = (pathname: string) =>
  VISIBLE_MENUS.find((menu) => isUnder(pathname, menu.match));
