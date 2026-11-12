/** 프로젝트 안의 역할. 리드는 프로젝트의 리드와 같은 사람이고, 나머지는 멤버다. */
export type ProjectRole = "lead" | "member"

/**
 * 프로젝트 멤버 한 사람(호호코워크 ProjectMember). 사람의 이름 · 부서는 구성원(entities/member)이 가지므로
 * 여기는 구성원 아이디와 프로젝트에서의 역할 · 참여한 날만 둔다. 화면이 구성원 목록과 이어 붙인다.
 */
export type ProjectMember = {
  /** 프로젝트 키(대문자). */
  projectKey: string
  /** 구성원 아이디(emp-…). */
  memberId: string
  role: ProjectRole
  /** 참여한 날(YYYY-MM-DD). */
  joinedAt: string
}
