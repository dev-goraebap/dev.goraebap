import type { DocumentIconName, DocumentLabel, DocumentLibrary, DocumentPerson, DocumentSavedView, ProjectDocument } from "../model/types"

/** 문서를 쓰는 사람들. 아이디는 업무 · 회의록의 사람과 같다. */
export const DOCUMENT_PEOPLE: readonly DocumentPerson[] = ["고재범", "김하늘", "이도윤", "박서준", "최유나", "정민호"].map((name, index) => ({ id: `person-${index}`, name }))
/** 이 앱의 "나". 새 문서를 만든 사람이다. */
export const DOCUMENT_ME = DOCUMENT_PEOPLE[0]

/** 문서 한 장의 씨앗. pages는 하위 페이지이고, 본문이 비고 pages가 있으면 구역 페이지가 된다. */
type Seed = {
  title: string; icon?: DocumentIconName; color?: string; labels?: string[]; author: number; editor?: number
  created: string; updated: string; body?: string; pages?: Seed[]
}

type ProjectSeed = { labels: DocumentLabel[]; views: DocumentSavedView[]; documents: Seed[] }

const label = (id: string, name: string, color: string): DocumentLabel => ({ id, name, color })

const COWORK: ProjectSeed = {
  labels: [
    label("plan", "기획", "#3b82f6"), label("design", "설계", "#8b5cf6"), label("dev", "개발", "#14b8a6"),
    label("ops", "운영", "#f97316"), label("guide", "가이드", "#22c55e"), label("ui", "디자인", "#ec4899"),
  ],
  views: [
    { id: "view-design", name: "설계 문서", labelIds: ["design", "dev"], layout: "grid", sort: "custom", direction: "asc" },
    { id: "view-ops", name: "운영 매뉴얼", labelIds: ["ops"], layout: "list", sort: "updated", direction: "desc" },
  ],
  documents: [
    {
      title: "호호코워크 제품 개요", icon: "sparkles", labels: ["plan"], author: 0, editor: 1, created: "2026-03-04T10:00:00+09:00", updated: "2026-10-30T17:20:00+09:00",
      body: `# 왜 만드는가

회사의 일정 · 업무 · 문서 · 결재가 메신저, 스프레드시트, 위키에 흩어져 있어 **한 가지 일을 하려고 서너 곳을 오가야** 했다. 호호코워크는 이 일을 한곳에서 다루는 사내 플랫폼이다.

## 누가 쓰는가

- 개발 · 디자인 팀: 프로젝트 업무와 설계 문서
- 운영 · 경영지원: 일정, 휴가, 공지, 결재
- 모든 구성원: 알림함과 주간 보고

## 원칙

> 한 번 쓴 내용은 한 곳에만 둔다. 다른 곳에서는 그 자리를 가리킨다.

- 데스크톱과 휴대폰에서 같은 일을 할 수 있다. 휴대폰은 줄인 화면이 아니라 자기 화면이다.
- 에이전트도 사람과 같은 권한으로 일하고, 한 일은 그 사람 이름으로 남는다.`,
      pages: [
        {
          title: "목표와 범위", icon: "checks", author: 0, created: "2026-03-05T09:30:00+09:00", updated: "2026-09-18T11:00:00+09:00",
          body: `## 2026년 목표

1. 메신저로 주고받던 업무 요청을 모두 업무로 옮긴다.
2. 휴가 · 일정 · 결재를 한 달력에서 본다.
3. 위키의 설계 문서를 프로젝트 문서함으로 옮긴다.

## 하지 않는 것

- 메신저 자체를 대신하지 않는다. 대화는 메신저에서, 기록은 호호코워크에서 한다.
- 회계 · 급여는 기존 시스템을 그대로 쓰고 결과만 연결한다.`,
        },
        {
          title: "용어집", icon: "notes", author: 1, created: "2026-03-10T14:00:00+09:00", updated: "2026-10-02T10:40:00+09:00",
          body: `## 자주 쓰는 말

- **업무**: 프로젝트 안에서 누군가 할 일. 키와 번호로 부른다(\`COWORK-14\`).
- **사이클**: 2주 단위로 묶은 업무의 모음.
- **문서함**: 프로젝트마다 하나씩 있는 문서의 자리. 라벨과 뷰로 나누어 본다.
- **하위 페이지**: 문서 아래에 이어 쓴 페이지. 목차로 오간다.
- **표식**: 프로젝트 · 문서 앞에 붙는 아이콘과 색.`,
        },
      ],
    },
    {
      title: "아키텍처 정의서", icon: "structure", color: "#8b5cf6", labels: ["design", "dev"], author: 2, editor: 2, created: "2026-04-01T10:00:00+09:00", updated: "2026-11-10T16:05:00+09:00",
      body: `# 개요

호호코워크는 하나의 웹 앱과 하나의 API 서버, 그리고 둘이 함께 읽는 PostgreSQL로 이루어진다. 이 문서는 각 부분의 책임과 경계를 정한다.

## 구성

- **웹**: React 앱. 화면 · 상태 · 라우팅을 맡는다.
- **API 서버**: 인증, 권한, 업무 규칙. 모든 쓰기는 여기를 거친다.
- **작업자**: 회의 녹음 받아쓰기, 알림 발송 같은 오래 걸리는 일.

## 결정 기록

중요한 구조 결정은 이 문서의 하위 페이지로 남기고, 기각한 대안도 함께 적는다.`,
      pages: [
        {
          title: "백엔드", icon: "folder", author: 2, created: "2026-04-01T10:10:00+09:00", updated: "2026-04-01T10:10:00+09:00",
          pages: [
            {
              title: "서버 구조", icon: "branch", author: 2, editor: 3, created: "2026-04-02T11:00:00+09:00", updated: "2026-10-21T15:30:00+09:00",
              body: `## 계층

요청은 \`controller → service → repository\` 순서로 내려간다. 위 계층은 아래 계층만 부른다.

### 트랜잭션

쓰기는 service 메서드 하나가 트랜잭션 하나다. 알림 발송은 커밋 뒤 작업자에게 넘긴다.

\`\`\`
POST /api/v1/projects/{key}/work-items
  → WorkItemController.create
  → WorkItemService.create   (트랜잭션)
  → NotificationQueue.push   (커밋 뒤)
\`\`\``,
            },
            {
              title: "데이터 모델", icon: "key", author: 3, created: "2026-04-08T09:00:00+09:00", updated: "2026-11-03T13:45:00+09:00",
              body: `## 주요 테이블

- \`project\`: 키(대문자 2~10자), 이름, 표식
- \`work_item\`: 프로젝트 키와 번호가 함께 유일하다
- \`document\`: \`parent_id\`로 하위 페이지를 잇는다
- \`document_label\`: 문서함마다 따로 둔다

## 지우기

문서는 지우면 하위 페이지까지 함께 지운다. 업무는 지우지 않고 취소 상태로 둔다.`,
            },
          ],
        },
        {
          title: "프런트엔드", icon: "folder", author: 2, created: "2026-04-01T10:12:00+09:00", updated: "2026-04-01T10:12:00+09:00",
          pages: [
            {
              title: "화면 구조(FSD)", icon: "structure", author: 1, created: "2026-04-12T10:00:00+09:00", updated: "2026-11-07T18:10:00+09:00",
              body: `## 계층

\`app → pages → widgets → features → entities → shared\` 순서로 나누고 필요한 계층만 둔다.

- 위 계층을 아래 계층에서 가져오지 않는다.
- 같은 계층의 다른 슬라이스를 직접 가져오지 않는다.
- 슬라이스 밖에서는 \`index.ts\` 공개 진입점으로만 가져온다.

> 두 화면 이상이 쓰는 부품은 shared/ui에 둔다. 페이지는 무엇을 보일지만 정한다.`,
            },
            {
              title: "상태와 데이터 읽기", icon: "workflow", author: 1, editor: 2, created: "2026-04-15T15:00:00+09:00", updated: "2026-10-12T09:20:00+09:00",
              body: `## 원칙

서버에서 읽은 것은 TanStack Query 캐시가 들고, 화면만의 상태(열림 · 고른 탭)는 컴포넌트가 든다.

## 주소에 두는 것

새로고침과 뒤로 가기를 따라야 하는 것은 주소에 둔다: 고른 뷰, 찾는 말, 열린 양식(\`?compose\`).`,
            },
          ],
        },
        {
          title: "배포 구성", icon: "settings", author: 3, created: "2026-05-20T10:00:00+09:00", updated: "2026-09-30T14:00:00+09:00",
          body: `## 환경

- **개발**: 브랜치마다 미리보기 주소
- **스테이징**: main에 합치면 자동 배포
- **운영**: 태그를 달면 배포, 화요일 · 목요일 오전에만

## 되돌리기

운영 배포는 직전 태그로 다시 배포해 되돌린다. DB 변경은 되돌릴 수 있는 것만 같은 배포에 넣는다.`,
        },
      ],
    },
    {
      title: "화면 설계 원칙", icon: "sparkles", color: "#ec4899", labels: ["ui", "design"], author: 1, editor: 4, created: "2026-05-02T10:00:00+09:00", updated: "2026-11-05T11:30:00+09:00",
      body: `## 휴대폰

분기점은 64rem(1024px) 하나다. 그보다 좁으면 사이드바 대신 하단 탭을 두고, 팝오버는 바텀시트로, 대화상자는 전체 화면으로 바꾼다.

## 색

- 색은 의미 토큰으로만 쓴다. 다크 모드는 토큰 값이 맡는다.
- 사용자가 고른 색(라벨 · 표식)은 데이터이므로 그대로 그린다.

## 아이콘

Solar 하나로 통일한다. 고른 상태 · 열림 · 지금 자리는 같은 아이콘의 Bold Duotone으로 그린다.`,
    },
    {
      title: "API 규약", icon: "branch", labels: ["dev"], author: 3, editor: 2, created: "2026-05-11T09:00:00+09:00", updated: "2026-10-27T10:15:00+09:00",
      body: `## 주소

- 복수 명사, 소문자, 하이픈: \`/api/v1/work-items\`
- 프로젝트 안의 자원은 프로젝트 키 아래에 둔다: \`/api/v1/projects/{key}/documents\`

## 낙관적 잠금

고치는 요청은 읽을 때 받은 \`version\`을 함께 보낸다. 그사이 다른 사람이 고쳤으면 409로 거절한다.

## 오류

\`\`\`
{ "code": "DOCUMENT_NOT_FOUND", "message": "문서를 찾을 수 없습니다" }
\`\`\`

메시지는 화면에 그대로 보여도 되는 한국어 문장으로 쓴다.`,
    },
    {
      title: "릴리스 절차", icon: "megaphone", labels: ["ops"], author: 3, editor: 5, created: "2026-06-03T10:00:00+09:00", updated: "2026-11-11T09:40:00+09:00",
      body: `## 순서

1. 이번 사이클에 끝난 업무를 확인하고 릴리스 노트를 쓴다.
2. 스테이징에서 휴대폰 · 데스크톱, 라이트 · 다크를 확인한다.
3. 태그를 달아 운영에 배포한다.
4. 공지사항에 릴리스 노트를 올린다.

## 확인 목록

- 로그인 · 알림함 · 업무 만들기가 되는가
- 새 DB 변경을 되돌릴 수 있는가
- 오류 알림 채널이 조용한가`,
    },
    {
      title: "장애 대응 매뉴얼", icon: "shield", color: "#ef4444", labels: ["ops", "guide"], author: 5, editor: 3, created: "2026-06-20T14:00:00+09:00", updated: "2026-10-15T16:50:00+09:00",
      body: `## 처음 10분

1. 장애 채널에 무엇이 안 되는지 한 줄로 알린다.
2. 최근 배포가 있었으면 먼저 되돌린다.
3. 담당자를 정하고, 담당자가 아닌 사람은 채널에 추측을 쓰지 않는다.

> 원인을 찾기보다 서비스를 되살리는 것이 먼저다.`,
      pages: [
        {
          title: "등급과 연락 체계", icon: "notes", author: 5, created: "2026-06-20T14:30:00+09:00", updated: "2026-09-02T10:00:00+09:00",
          body: `## 등급

- **1등급**: 로그인 불가, 데이터 손실. 즉시 전원 호출.
- **2등급**: 주요 기능 하나가 안 됨. 담당 팀 호출.
- **3등급**: 우회할 수 있는 불편. 다음 업무 시간에 처리.

## 연락 순서

당번 → 팀장 → CTO 순서로, 10분 안에 답이 없으면 다음 사람에게 넘긴다.`,
        },
        {
          title: "사후 검토 양식", icon: "checks", author: 3, created: "2026-07-01T11:00:00+09:00", updated: "2026-10-15T16:50:00+09:00",
          body: `## 적을 것

- 무슨 일이 있었나(시각순)
- 사용자에게 어떤 영향이 있었나
- 왜 일어났나 — 사람이 아니라 구조를 본다
- 다시 일어나지 않게 무엇을 바꾸나(업무로 만든다)`,
        },
      ],
    },
    {
      title: "4분기 로드맵", icon: "calendar", labels: ["plan"], author: 0, created: "2026-10-06T12:00:00+09:00", updated: "2026-11-09T14:25:00+09:00",
      body: `## 묶음

### 10월: 휴대폰

하단 탭과 만들기 버튼, 바텀시트로 바뀌는 메뉴를 낸다.

### 11월: 문서함

라벨 · 뷰 · 하위 페이지 목차를 낸다. 끌어서 옮기기는 내년 1분기로 미뤘다.

### 12월: 에이전트

MCP로 업무 · 문서를 읽고 쓰는 도구를 사내에 연다.`,
    },
    {
      title: "신규 입사자 개발 환경 설정", icon: "settings", labels: ["guide", "dev"], author: 4, editor: 1, created: "2026-07-14T10:00:00+09:00", updated: "2026-09-25T15:10:00+09:00",
      body: `## 첫날

1. 사내 계정으로 로그인하고 저장소 권한을 요청한다.
2. Node 22와 pnpm을 설치한다.
3. 저장소를 받아 웹을 띄운다.

\`\`\`
pnpm install
pnpm --filter web dev
\`\`\`

## 막히면

\`#dev-help\` 채널에 화면과 명령을 함께 올린다. 첫 주에는 짝꿍이 한 명 붙는다.`,
    },
    {
      title: "검색 개선 메모", icon: "notes", labels: ["plan"], author: 2, created: "2026-11-11T18:00:00+09:00", updated: "2026-11-11T18:00:00+09:00",
      body: "",
    },
  ],
}

const DESIGN: ProjectSeed = {
  labels: [label("token", "토큰", "#ec4899"), label("component", "부품", "#3b82f6")],
  views: [],
  documents: [
    {
      title: "색 토큰 목록", icon: "sparkles", color: "#ec4899", labels: ["token"], author: 1, created: "2026-08-04T10:00:00+09:00", updated: "2026-10-20T13:00:00+09:00",
      body: `## 바탕

- \`background\`: 페이지 바탕
- \`band\`: 그룹 머리 띠
- \`row-hover\`: 목록 줄을 가리킬 때

## 글자

- \`foreground\`: 본문
- \`muted-foreground\`: 보조 글자`,
    },
    {
      title: "속성 알약", icon: "checks", labels: ["component"], author: 4, created: "2026-08-21T15:00:00+09:00", updated: "2026-11-02T10:30:00+09:00",
      body: `## 모양

24px 둥근 알약. 비어 있으면 속성의 아이콘과 이름을 보조 글자색으로, 정해지면 그 값을 보인다.

## 휴대폰

44px 높이로 키우고, 누르면 바텀시트가 뜬다.`,
    },
  ],
}

const AGENT: ProjectSeed = {
  labels: [label("spec", "명세", "#8b5cf6")],
  views: [],
  documents: [
    {
      title: "MCP 도구 목록", icon: "workflow", labels: ["spec"], author: 2, created: "2026-09-08T10:00:00+09:00", updated: "2026-11-06T17:00:00+09:00",
      body: `## 읽기

- \`list_issues\`, \`get_issue\`
- \`list_documents\`, \`get_document\`

## 쓰기

- \`create_issue\`, \`update_issue\`
- \`update_document_section\`: 문서의 한 절만 고친다`,
    },
  ],
}

const SEEDS: Record<string, ProjectSeed> = { COWORK, DESIGN, AGENT }

let nextId = 100

/** 씨앗을 펼쳐 문서함 순서(위 문서 다음에 그 하위)대로 늘어놓는다. */
function plant(projectKey: string, seeds: Seed[], parentId?: string): ProjectDocument[] {
  return seeds.flatMap(seed => {
    const id = `doc-${++nextId}`
    const document: ProjectDocument = {
      id, projectKey, parentId, title: seed.title, body: seed.body ?? "", icon: seed.icon ?? "document", color: seed.color,
      labelIds: parentId ? [] : seed.labels ?? [], author: DOCUMENT_PEOPLE[seed.author], updatedBy: DOCUMENT_PEOPLE[seed.editor ?? seed.author],
      createdAt: seed.created, updatedAt: seed.updated,
    }
    return [document, ...plant(projectKey, seed.pages ?? [], id)]
  })
}

/** 프로젝트 키(대문자)의 문서함. 씨앗이 없는 프로젝트는 빈 문서함이다. 아이디는 프로젝트 순서로 정해 새로고침해도 같다. */
const LIBRARIES: Record<string, DocumentLibrary> = Object.fromEntries(
  Object.entries(SEEDS).map(([key, seed]) => [key, { labels: seed.labels, views: seed.views, documents: plant(key, seed.documents) }]),
)

export function mockLibrary(projectKey: string): DocumentLibrary {
  return structuredClone(LIBRARIES[projectKey.toUpperCase()] ?? { labels: [], views: [], documents: [] })
}
