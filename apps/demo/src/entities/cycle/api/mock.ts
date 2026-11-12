import type { CycleList, CycleSettings } from "../model/types"

/*
 * cowork 프로젝트의 사이클: 2주씩, 월요일 시작. 9월 말부터 세 사이클을 마쳤고 11월 9일에 시작한 4차가 진행 중,
 * 그 뒤로 둘을 미리 만들어 두었다. 마친 사이클에는 끝낸 업무만 남는다(남은 업무는 마칠 때 다음 사이클로 넘겼다).
 * 6차는 아직 비어 있다. 백로그 업무(cowork-14~17)는 어느 사이클에도 없다.
 */
const COWORK: CycleList = {
  settings: { isEnabled: true, weeks: 2, startDay: 1, upcoming: 2, addsStarted: true, addsCompleted: false },
  cycles: [
    {
      id: "cycle-cowork-1", number: 1, name: "1차 사이클", goal: "팀 일정 알림과 휴대폰 필터 다듬기",
      startDate: "2026-09-28", endDate: "2026-10-11", completedAt: "2026-10-11", workItemKeys: ["cowork-19", "cowork-20"],
    },
    {
      id: "cycle-cowork-2", number: 2, name: "2차 사이클", goal: "업무 키 체계와 캘린더 시간대 버그 정리",
      startDate: "2026-10-12", endDate: "2026-10-25", completedAt: "2026-10-26", workItemKeys: ["cowork-2", "cowork-3"],
    },
    {
      id: "cycle-cowork-3", number: 3, name: "3차 사이클", goal: "복구 절차 점검",
      startDate: "2026-10-26", endDate: "2026-11-08", completedAt: "2026-11-09", workItemKeys: ["cowork-18"],
    },
    {
      id: "cycle-cowork-4", number: 4, name: "4차 사이클", goal: "휴대폰 화면과 MCP 문서 도구 안정화",
      startDate: "2026-11-09", endDate: "2026-11-22",
      workItemKeys: ["cowork-1", "cowork-4", "cowork-5", "cowork-6", "cowork-7", "cowork-8", "cowork-9", "cowork-11"],
    },
    {
      id: "cycle-cowork-5", number: 5, name: "5차 사이클", goal: "결재함 반려 사유와 다크 모드 라벨",
      startDate: "2026-11-23", endDate: "2026-12-06", workItemKeys: ["cowork-10", "cowork-12", "cowork-13"],
    },
    { id: "cycle-cowork-6", number: 6, name: "6차 사이클", startDate: "2026-12-07", endDate: "2026-12-20", workItemKeys: [] },
  ],
}

/** 사이클을 켜지 않은 프로젝트의 설정: 켜면 이 값으로 사이클을 만든다. */
export const DEFAULT_SETTINGS: CycleSettings = { isEnabled: false, weeks: 2, startDay: 1, upcoming: 2, addsStarted: true, addsCompleted: false }

/** 프로젝트(소문자 키)의 사이클. 목록에 없는 프로젝트는 사이클을 쓰지 않는다. */
export function mockCyclesOf(projectKey: string): CycleList {
  if (projectKey === "cowork") return structuredClone(COWORK)
  return { cycles: [], settings: { ...DEFAULT_SETTINGS } }
}
