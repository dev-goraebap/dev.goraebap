/** 지금 어디서 일하는지. 목록의 상태 칸과 프로필의 상태가 쓴다. */
export type MemberStatus = "working" | "remote" | "outside" | "leave" | "away"

/** 부서. lead는 부서장의 구성원 아이디. parent가 없으면 맨 위 부서다. */
export type Department = { id: string; name: string; lead: string; parent?: string }

/** 구성원 한 사람(호호코워크 OrgPerson + 인사 정보). */
export type Member = {
  id: string
  name: string
  departmentId: string
  /** 직급: 사원 · 대리 · 과장 · 차장 · 부장 · 대표. */
  rank: string
  /** 직위: 맡은 자리(팀장 · 대표이사). 없으면 직급만 보인다. */
  position?: string
  email: string
  phone: string
  status: MemberStatus
  /** 입사일(YYYY-MM-DD). */
  joinedAt: string
  /** 고른 기본 그림 번호(0~17). 없으면 아이디로 정해지는 그림. */
  picture?: number
}

/** 내가 직접 바꿀 수 있는 것(호호코워크 내 정보: 프로필 이미지 · 휴대전화). */
export type MyPatch = Partial<Pick<Member, "picture" | "phone">>
