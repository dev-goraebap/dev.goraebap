import type { SystemIconName } from "@goraebap/ui-react/icons";

type SiteMenuTarget = "/design-system/overview" | "/reference/frontend" | "/backend";

export interface SiteMenu {
  label: string;
  icon: SystemIconName;
  description: string;
  to: SiteMenuTarget;
  match: string[];
  landing?: boolean;
  children?: { label: string; to: SiteMenuTarget; match: string[] }[];
}

export const SITE_MENUS: SiteMenu[] = [
  {
    label: "디자인 시스템",
    icon: "components",
    description: "파운데이션·컴포넌트·레이아웃·패턴",
    to: "/design-system/overview",
    match: ["/design-system"],
  },
  {
    label: "프론트엔드",
    icon: "layouts",
    description: "프론트엔드 구현 기준",
    to: "/reference/frontend",
    match: ["/reference/frontend", "/frontend"],
    landing: true,
  },
  {
    label: "백엔드",
    icon: "code",
    description: "백엔드 플레이북·아티클·레퍼런스",
    to: "/backend",
    match: ["/backend"],
    landing: true,
  },
];

export const VISIBLE_MENUS = SITE_MENUS;

export const LANDING_MENUS = SITE_MENUS.filter((menu) => menu.landing);

export const isUnder = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const activeMenu = (pathname: string) =>
  VISIBLE_MENUS.find((menu) => isUnder(pathname, menu.match));
