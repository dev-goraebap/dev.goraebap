import { LABELS, PEOPLE } from "../model/marks"
import type { WorkItem, WorkItemActivity, WorkItemPriority, WorkItemStatus, WorkItemType } from "../model/types"

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

/** 손으로 쓴 본문. 나머지 업무는 bodyOf가 제목과 라벨로 만든다. */
const BODIES: Partial<Record<number, string>> = {
  3: `팀 캘린더의 **휴가** 일정이 하루 늦게 그려집니다. 서버는 날짜만 있는 일정을 UTC 자정으로 내려 주고, 화면이 그것을 한국 시각으로 바꾸면서 전날 밤이 됩니다.

## 재현
1. 10월 21일 하루 휴가를 등록한다
2. 팀 캘린더의 월간 뷰를 연다
3. 휴가가 10월 20일 칸에 보인다

## 고친 것
날짜만 있는 일정은 시각 없이 \`YYYY-MM-DD\`로 주고받고, 화면은 그 문자열을 그대로 칸에 맞춥니다.

\`\`\`
const day = event.allDay ? event.start.slice(0, 10) : toLocalDay(event.start)
\`\`\``,
  6: `MCP 문서 도구(\`get_document\`)가 2만 자가 넘는 본문을 중간에서 잘라 보냅니다. 응답 크기 제한에 걸린 것으로 보입니다.

- 긴 본문은 절 단위로 나눠 \`get_document_section\`으로 읽게 안내한다
- 잘렸을 때는 잘렸다는 표시와 다음 절의 위치를 함께 준다
- 제한 값은 설정으로 뺀다

> 에이전트가 잘린 줄 모르고 앞부분만 고쳐 저장하면 뒷부분이 사라집니다. 이번 주 안에 막아야 합니다.`,
  14: `공지사항 편집기에 표를 넣을 수 있게 합니다. 지금은 표를 붙여 넣으면 칸이 모두 한 문단으로 합쳐져서, 근무표나 일정표를 그림으로 찍어 올리고 있습니다.

## 할 일
- 도구 줄에 **표 넣기**를 더하고 처음 크기는 3 × 3으로 한다
- 줄과 칸을 더하고 빼는 메뉴를 표 안에서 연다
- 엑셀이나 구글 시트에서 붙여 넣은 표를 그대로 받는다
- 휴대폰에서는 표가 넓으면 표 안에서만 가로로 넘긴다

## 참고
본문은 Markdown으로 저장하므로 표도 GFM 표로 바꿔 둡니다. 저장 형식은 아래와 같습니다.

\`\`\`
| 이름 | 근무 | 비고 |
| --- | --- | --- |
| 고재범 | 재택 | 오후 회의 |
\`\`\`

머리 줄이 없는 표는 첫 줄을 머리 줄로 삼고, 합친 칸은 풀어서 저장합니다.`,
}

const bodyOf = (number: number, title: string, labels: readonly string[]) => BODIES[number] ?? `${title} 작업입니다. 지금 동작을 먼저 확인하고, 고칠 범위를 정한 뒤 진행합니다.

## 할 일
- 지금 동작을 재현하고 원인을 적는다
- ${labels.join(" · ")} 쪽 담당과 범위를 맞춘다
- 고친 뒤 데스크톱과 휴대폰, 라이트와 다크에서 확인한다

확인은 \`npm run check\`로 타입부터 봅니다. 끝나면 결과를 이 업무에 댓글로 남깁니다.`

export const mockWorkItems: WorkItem[] = SEEDS.map(([title, status, priority, labels, date, assignee, type = "task"], index) => {
  const number = index + 1
  return {
    id: `work-item-${number}`, key: `${PROJECT_KEY}-${number}`, number, title, status, priority, type,
    body: bodyOf(number, title, labels),
    labels: labels.map(name => LABELS.find(label => label.name === name)!),
    assignee: PEOPLE.find(person => person.name === assignee),
    dueDate: date,
    updatedAt: `${date}T01:00:00Z`,
  }
})

const COMMENTS = [
  "원인은 찾았습니다. 오늘 안에 고친 것을 올리겠습니다.",
  "휴대폰에서도 같은 문제가 있는지 같이 봐 주세요.",
  "범위가 커지면 나눠서 진행하는 게 좋겠습니다.\n디자인 쪽 확인은 제가 맡을게요.",
  "확인했습니다. 리뷰 요청 주시면 바로 보겠습니다.",
]

/** 업무의 활동 목 데이터: 만듦, (백로그가 아니면) 상태 옮김, 댓글 하나 둘. 오래된 것부터. */
export function mockActivityOf(item: WorkItem): WorkItemActivity[] {
  const day = (offset: number, hour: number) => {
    const date = new Date(item.updatedAt)
    date.setUTCDate(date.getUTCDate() - offset)
    date.setUTCHours(hour)
    return date.toISOString()
  }
  const author = PEOPLE[item.number % PEOPLE.length]
  const worker = item.assignee ?? author
  const other = PEOPLE[(item.number + 1) % PEOPLE.length]
  const entries: WorkItemActivity[] = [{ id: `${item.key}-created`, kind: "created", at: day(6, 0), actor: author }]
  if (item.status !== "backlog") {
    entries.push({ id: `${item.key}-status`, kind: "changed", field: "status", before: "백로그", after: "할 일", at: day(5, 2), actor: author })
  }
  entries.push({ id: `${item.key}-comment-1`, kind: "comment", body: COMMENTS[item.number % COMMENTS.length], at: day(3, 5), actor: other })
  if (item.status === "in_progress" || item.status === "done") {
    entries.push({ id: `${item.key}-progress`, kind: "changed", field: "status", before: "할 일", after: "진행 중", at: day(2, 1), actor: worker })
    entries.push({ id: `${item.key}-comment-2`, kind: "comment", body: COMMENTS[(item.number + 1) % COMMENTS.length], at: day(1, 7), actor: worker })
  }
  if (item.status === "done") {
    entries.push({ id: `${item.key}-done`, kind: "changed", field: "status", before: "진행 중", after: "완료", at: day(0, 0), actor: worker })
  }
  return entries
}
