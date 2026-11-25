// 플레이북이 조합하는 스킬과 역할. Webapp 플러그인과 Claude 기본 스킬만 이름으로 적고,
// 프로젝트마다 다른 도구(이슈 도구, 배포 절차, 글쓰기를 맡길 곳)는 플러그인 지침처럼 역할로 적는다.

export interface Toolkit {
  id: string;
  label: string;
  // 점과 선을 칠하는 색. 화면 테마 배경과 섞어 쓴다.
  tone: string;
}

export const TOOLKITS = [
  { id: "webapp", label: "webapp 플러그인", tone: "oklch(0.62 0.13 250)" },
  { id: "claude", label: "Claude 기본 스킬", tone: "oklch(0.62 0.15 30)" },
  { id: "role", label: "프로젝트가 정하는 역할", tone: "oklch(0.6 0.02 260)" },
] as const satisfies readonly Toolkit[];

export type ToolkitId = (typeof TOOLKITS)[number]["id"];

export interface SkillRef {
  name: string;
  toolkit: ToolkitId;
  // 이 사이트에서 사람이 읽는 글로 옮긴 곳
  href?: string;
}

export const SKILLS = {
  "goraebap-mode": { name: "goraebap-mode", toolkit: "webapp", href: "/playbook" },
  onboarding: { name: "onboarding", toolkit: "webapp", href: "/playbook/agents" },
  "webapp-project": { name: "webapp-project", toolkit: "webapp" },
  "frontend-engineering": {
    name: "frontend-engineering",
    toolkit: "webapp",
    href: "/frontend/engineering",
  },
  "frontend-design-system": {
    name: "frontend-design-system",
    toolkit: "webapp",
    href: "/frontend/design-system/overview",
  },
  "frontend-interaction": {
    name: "frontend-interaction",
    toolkit: "webapp",
    href: "/frontend/interaction",
  },
  "backend-engineering": {
    name: "backend-engineering",
    toolkit: "webapp",
    href: "/backend/engineering",
  },
  browser: { name: "built-in-browser", toolkit: "claude" },
  "skill-creator": { name: "skill-creator", toolkit: "claude" },
  "issue-tool": { name: "이슈 도구", toolkit: "role" },
  "deploy-procedure": { name: "배포 절차", toolkit: "role" },
  "writer-role": { name: "글쓰기 역할", toolkit: "role" },
} as const satisfies Record<string, SkillRef>;

export type SkillId = keyof typeof SKILLS;
