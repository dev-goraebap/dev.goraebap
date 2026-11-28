import type { SystemIconName } from "@goraebap/ui-react/icons";

export type SiteMenuTarget =
  | "/blog"
  | "/webapp"
  | "/webapp/design-system/overview"
  | "/webapp/frontend"
  | "/webapp/backend"
  | "/glossary";

export type SiteSpaceId = "blog" | "webapp";

export interface SiteMenu {
  label: string;
  icon: SystemIconName;
  description: string;
  to: SiteMenuTarget;
  match: string[];
  badge?: string;
}

export interface SiteSpace {
  id: SiteSpaceId;
  label: string;
  description: string;
  to: SiteMenuTarget;
  match: string[];
  menus: SiteMenu[];
}

export const SITE_SPACES: SiteSpace[] = [
  {
    id: "blog",
    label: "블로그",
    description: "설계 생각과 프론트·백엔드 아티클 모음",
    to: "/blog",
    match: ["/blog"],
    menus: [],
  },
  {
    id: "webapp",
    label: "웹 애플리케이션",
    description: "fullstack 플러그인 기준의 디자인 시스템·프론트엔드·백엔드",
    to: "/webapp",
    match: ["/webapp", "/glossary"],
    menus: [
      {
        label: "홈",
        icon: "rocket",
        description: "fullstack 플러그인 시작하기·전역 플레이북·모노레포 기준",
        to: "/webapp",
        match: [
          "/webapp/tutorials",
          "/webapp/playbooks",
          "/webapp/articles",
          "/webapp/reference",
        ],
      },
      {
        label: "디자인 시스템",
        icon: "components",
        description: "파운데이션·컴포넌트·레이아웃·패턴",
        to: "/webapp/design-system/overview",
        match: ["/webapp/design-system"],
        badge: "Beta",
      },
      {
        label: "프론트엔드",
        icon: "layouts",
        description: "프론트엔드 플레이북·아티클·레퍼런스",
        to: "/webapp/frontend",
        match: ["/webapp/frontend"],
      },
      {
        label: "백엔드",
        icon: "code",
        description: "백엔드 플레이북·아티클·레퍼런스",
        to: "/webapp/backend",
        match: ["/webapp/backend"],
      },
    ],
  },
];

export const FOOTER_MENUS: { label: string; to: SiteMenuTarget }[] = [
  { label: "블로그", to: "/blog" },
  { label: "웹 애플리케이션", to: "/webapp" },
  { label: "디자인 시스템", to: "/webapp/design-system/overview" },
  { label: "프론트엔드", to: "/webapp/frontend" },
  { label: "백엔드", to: "/webapp/backend" },
  { label: "용어집", to: "/glossary" },
];

export const isUnder = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const activeSpace = (pathname: string) =>
  SITE_SPACES.find((space) => isUnder(pathname, space.match));

export const activeMenu = (pathname: string) => {
  const space = activeSpace(pathname);
  return space?.menus.find((menu) => isUnder(pathname, menu.match));
};
