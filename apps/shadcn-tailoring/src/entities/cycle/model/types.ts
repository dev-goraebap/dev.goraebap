/**
 * 사이클이 선 자리(호호코워크 CycleView.state). 마친 날이 있으면 마침, 아니면 오늘과 기간으로 정한다.
 * 기간 끝남은 날이 지났지만 아직 마치지 않은 것(남은 업무를 넘기지 않았다).
 */
export type CycleState = "upcoming" | "current" | "ended" | "completed"

export type Cycle = {
  id: string
  /** 프로젝트 안의 차례(1차, 2차 …). 새 사이클 이름의 기본값에 쓴다. */
  number: number
  name: string
  /** 이 사이클에서 끝낼 것. */
  goal?: string
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD(이 날까지) */
  endDate: string
  /** 마친 날(YYYY-MM-DD). 있으면 마침. */
  completedAt?: string
  /**
   * 담긴 업무의 키(cowork-14). 업무 쪽에 사이클 칸이 없으므로 사이클이 업무를 가리킨다.
   * 한 업무는 한 사이클에만 담긴다.
   */
  workItemKeys: string[]
}

/** 프로젝트가 사이클을 돌리는 방식(호호코워크 CycleSettings). */
export type CycleSettings = {
  isEnabled: boolean
  /** 한 사이클의 길이(주). */
  weeks: number
  /** 시작 요일: 1 월요일 … 7 일요일. */
  startDay: number
  /** 진행 중인 사이클 다음에 미리 만들어 둘 개수. */
  upcoming: number
  /** 진행 중이 된 업무를 지금 사이클에 넣는다. */
  addsStarted: boolean
  /** 완료된 업무를 지금 사이클에 넣는다. */
  addsCompleted: boolean
}

export type CycleList = { cycles: Cycle[]; settings: CycleSettings }

/** 만들기 · 고치기 양식이 정하는 것. */
export type CycleInput = Pick<Cycle, "name" | "goal" | "startDate" | "endDate">
