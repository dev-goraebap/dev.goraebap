import { PROJECT_PEOPLE } from "../model/marks"
import type { Project, ProjectIconName, ProjectStatus } from "../model/types"

type Seed = [key: string, name: string, description: string, icon: ProjectIconName, color: string, lead: number, members: number, progress: number, status?: ProjectStatus, starred?: boolean]

/* 회사의 프로젝트 여덟 개. 둘은 보관했고, 진행 중인 것 셋에 별표를 했다. */
const SEEDS: Seed[] = [
  ["COWORK", "호호코워크", "일정 · 업무 · 문서를 한곳에서 다루는 사내 플랫폼", "projects", "#3b82f6", 0, 12, 64, "active", true],
  ["MOBILE", "호호코워크 모바일", "휴대폰에서 알림 · 결재 · 근태를 처리하는 앱", "monitor", "#14b8a6", 1, 6, 38, "active", true],
  ["AGENT", "에이전트 연동", "MCP로 이슈 · 문서를 읽고 쓰는 에이전트 도구", "sparkles", "#8b5cf6", 2, 4, 52, "active", true],
  ["TOWN", "호호타운", "구성원이 모여 쉬는 픽셀 마을", "gamepad", "#22c55e", 3, 5, 21],
  ["DESIGN", "디자인 시스템", "부품 · 토큰 · 아이콘 규칙과 문서", "kanban", "#ec4899", 1, 7, 76],
  ["SEC", "보안 점검 2026", "접근 권한 · 백업 · 복구 절차 점검", "shield", "#ef4444", 2, 3, 9],
  ["SITE25", "회사 소개 사이트 개편", "2025년 회사 소개 사이트 새 단장", "megaphone", "#f97316", 0, 4, 100, "archived"],
  ["ONBOARD", "신입 온보딩 자료", "첫 주 안내서와 계정 발급 순서", "folder", "#6b7280", 3, 2, 100, "archived"],
]

export const mockProjects: Project[] = SEEDS.map(([key, name, description, icon, color, lead, memberCount, progress, status = "active", starred = false], index) => ({
  id: `project-${index + 1}`, key, slug: key.toLowerCase(), name, description, icon, color, lead: PROJECT_PEOPLE[lead], memberCount, progress, status, starred, position: index,
}))
