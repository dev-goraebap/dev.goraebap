// 이 계정으로 들어가는 서비스
export interface ConnectedService {
  name: string;
  description: string;
  href: string;
}

export const CONNECTED_SERVICES: ConnectedService[] = [
  {
    name: "Productivity",
    description: "프로젝트 · 이슈 · 문서 협업 공간",
    href: "https://productivity.goraebap.xyz",
  },
  {
    name: "dev.goraebap",
    description: "웹 애플리케이션 개발 지침과 디자인 시스템",
    href: "https://dev.goraebap.xyz",
  },
];
