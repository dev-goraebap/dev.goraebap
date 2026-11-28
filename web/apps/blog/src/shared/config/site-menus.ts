import type { SystemIconName } from "@goraebap/ui-react/icons";

type SiteMenuTarget =
  | "/design-system/overview"
  | "/frontend"
  | "/backend"
  | "/agents"
  | "/blog"
  | "/glossary";

export interface SiteMenu {
  label: string;
  icon: SystemIconName;
  description: string;
  to: SiteMenuTarget;
  match: string[];
  landing?: boolean;
  hideInHeader?: boolean;
  children?: { label: string; to: SiteMenuTarget; match: string[] }[];
}

export const SITE_MENUS: SiteMenu[] = [
  {
    label: "블로그",
    icon: "compass",
    description: "설계 생각과 프론트·백엔드 아티클 모음",
    to: "/blog",
    match: ["/blog"],
    landing: true,
  },
  {
    label: "프론트엔드",
    icon: "layouts",
    description: "프론트엔드 엔지니어링·디자인 시스템",
    to: "/frontend",
    match: ["/frontend", "/design-system"],
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
  {
    label: "디자인 시스템",
    icon: "components",
    description: "파운데이션·컴포넌트·레이아웃·패턴",
    to: "/design-system/overview",
    match: ["/design-system"],
    hideInHeader: true,
  },
  {
    label: "Agents",
    icon: "details",
    description: "fullstack 플러그인 튜토리얼·전역 플레이북·모노레포 기준",
    to: "/agents",
    match: ["/agents"],
    hideInHeader: true,
  },
  {
    label: "용어집",
    icon: "book",
    description: "프론트엔드·백엔드·디자인 시스템 통합 용어집",
    to: "/glossary",
    match: ["/glossary"],
    hideInHeader: true,
  },
];

export const VISIBLE_MENUS = SITE_MENUS;

export const HEADER_MENUS = VISIBLE_MENUS.filter((menu) => !menu.hideInHeader);

export const LANDING_MENUS = SITE_MENUS.filter((menu) => menu.landing);

export const isUnder = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const activeMenu = (pathname: string) =>
  VISIBLE_MENUS.find((menu) => isUnder(pathname, menu.match));
