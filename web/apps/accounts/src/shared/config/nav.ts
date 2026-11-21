export interface ConnectedService {
  name: string;
  description: string;
  href: string;
  devHint: string;
}

export const CONNECTED_SERVICES: ConnectedService[] = [
  {
    name: "Productivity",
    description: "프로젝트 · 이슈 · 문서 협업 공간",
    href: "https://productivity.goraebap.xyz",
    devHint: "localhost:4420",
  },
  {
    name: "Blog & UI",
    description: "개발 기록 · @goraebap/ui 레지스트리",
    href: "https://blog.goraebap.xyz",
    devHint: "localhost:5173",
  },
];

export const ACCOUNT_NAV_ITEMS = [
  { to: "/" as const, label: "허브", shortLabel: "허브", exact: true },
  { to: "/profile" as const, label: "프로필", shortLabel: "프로필", exact: false },
  { to: "/security" as const, label: "보안 · 토큰", shortLabel: "보안", exact: false },
];
