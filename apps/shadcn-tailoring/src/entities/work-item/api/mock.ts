import { LABELS, PEOPLE } from "../model/marks"
import type { WorkItem, WorkItemPriority, WorkItemStatus, WorkItemType } from "../model/types"

/*
 * cowork 프로젝트의 업무(호호코워크 플레이그라운드 fixtures를 옮긴 것). 모든 상태 · 우선순위 · 유형 · 라벨이 나오고, 몇 개는 담당자가 없다.
 * 마감일은 목록이 날짜를 보이도록 수정일과 같은 날로 둔다.
 */
type Seed = [title: string, status: WorkItemStatus, priority: WorkItemPriority, labels: string[], date: string, assignee?: string, type?: WorkItemType]

const SEEDS: Seed[] = [
  ["프로젝트 업무 목록을 상태별로 묶어 보이기", "done", "high", ["화면", "기능"], "2026-10-14", "고재범", "feature"],
  ["업무 키(cowork-n)를 프로젝트마다 이어서 매기기", "done", "medium", ["서버"], "2026-10-16", "이도윤"],
  ["팀 캘린더에서 휴가 일정이 하루 밀려 보이는 문제", "done", "urgent", ["버그", "서버"], "2026-10-20", "이도윤", "bug"],
  ["보드 뷰 카드에 우선순위와 레이블 보이기", "in_progress", "medium", ["화면", "디자인"], "2026-11-02", "김하늘", "feature"],
  ["에이전트 토큰 만들기 화면 다듬기", "in_progress", "low", ["디자인"], "2026-11-01", "박서준"],
  ["MCP 문서 도구가 긴 본문을 잘라 보내는 문제", "in_progress", "urgent", ["버그", "서버"], "2026-11-03", "이도윤", "bug"],
  ["휴대폰 하단 탭 위에 만들기 버튼 띄우기", "in_progress", "high", ["모바일", "화면"], "2026-11-03", "김하늘"],
  ["주간보고 목록 불러오기 속도 개선", "in_progress", "medium", ["성능", "서버"], "2026-10-31", "고재범"],
  ["표 뷰 머리 줄을 스크롤해도 위에 고정하기", "in_progress", "low", ["화면"], "2026-10-30", "박서준"],
  ["결재함에서 반려 사유를 목록에 함께 보이기", "todo", "high", ["기능", "화면"], "2026-10-29", "고재범", "feature"],
  ["프로젝트 문서 폴더를 끌어서 옮기기", "todo", "medium", ["기능"], "2026-10-28", "김하늘", "feature"],
  ["다크 모드에서 레이블 색이 흐리게 보이는 문제", "todo", "medium", ["버그", "디자인"], "2026-10-27", undefined, "bug"],
  ["GitLab 커밋을 업무 키로 이어 붙이기", "todo", "low", ["서버"], "2026-10-24", "이도윤", "epic"],
  ["공지사항 본문 편집기에 표 넣기", "backlog", "low", ["기능"], "2026-10-22"],
  ["조직도에서 팀원 검색하기", "backlog", "none", ["화면"], "2026-10-21", "박서준"],
  ["업무 알림을 메일로도 받기", "backlog", "medium", ["기능", "서버"], "2026-10-19"],
  ["디자인 시스템 문서에 아이콘 규칙 정리하기", "backlog", "none", ["문서", "디자인"], "2026-10-15", "김하늘"],
  ["Litestream 복구 절차 점검", "done", "high", ["서버", "문서"], "2026-10-12", "고재범"],
  ["휴대폰 필터 시트에서 고른 값 개수 보이기", "done", "low", ["모바일"], "2026-10-10", "김하늘", "feature"],
  ["팀 일정 알림 시간을 고를 수 있게 하기", "done", "medium", ["기능"], "2026-10-08", "박서준", "feature"],
]

export const PROJECT_KEY = "cowork"

export const mockWorkItems: WorkItem[] = SEEDS.map(([title, status, priority, labels, date, assignee, type = "task"], index) => {
  const number = index + 1
  return {
    id: `work-item-${number}`, key: `${PROJECT_KEY}-${number}`, number, title, status, priority, type,
    labels: labels.map(name => LABELS.find(label => label.name === name)!),
    assignee: PEOPLE.find(person => person.name === assignee),
    dueDate: date,
    updatedAt: `${date}T01:00:00Z`,
  }
})
