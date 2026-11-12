/** 진행 중 · 보관. 보관한 프로젝트는 보관함에 모이고 메뉴의 별표에서 빠진다. */
export type ProjectStatus = "active" | "archived"
export type ProjectPerson = { id: string; name: string }

/** 프로젝트 표식의 아이콘 이름(marks.ts의 PROJECT_ICONS). */
export type ProjectIconName = "projects" | "kanban" | "monitor" | "gamepad" | "sparkles" | "shield" | "megaphone" | "folder" | "flame" | "users"

export type Project = {
  id: string
  /** 영문 대문자 · 숫자 2~10자. 업무 번호 앞에 붙는다(COWORK-12). 일반 설정에서 바꿀 수 있다. */
  key: string
  /**
   * 주소와 프로젝트별 캐시가 쓰는 고정 이름(만들 때 키의 소문자: cowork). 키를 바꿔도 그대로라 업무 · 문서 · 사이클이 따라온다.
   * 호호코워크는 키를 바꾸면 새 주소로 옮기고 예전 주소도 열어 두는데, 목업은 고정 이름 하나로 대신한다.
   */
  slug: string
  name: string
  /** 한 줄 설명. */
  description?: string
  icon: ProjectIconName
  /** 사용자가 고른 표식 색(#RRGGBB). 데이터 색이다. */
  color: string
  lead: ProjectPerson
  memberCount: number
  /** 완료한 업무의 비율 0~100. */
  progress: number
  status: ProjectStatus
  /** 내 메뉴에 둘지(별표). */
  starred: boolean
  /** 관리자가 정한 순서(사용자 지정 정렬). */
  position: number
}

export type NewProject = Pick<Project, "key" | "name" | "description" | "icon" | "color" | "lead">
export type ProjectPatch = Partial<Pick<Project, "status" | "starred">>
/** 일반 설정에서 함께 저장하는 것. */
export type ProjectEdit = Pick<Project, "key" | "name" | "description" | "icon" | "color">
