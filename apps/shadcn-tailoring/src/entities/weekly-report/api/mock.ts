import { isSubmitted } from "../model/states"
import type { ReportMember, ReportState, WeeklyReport } from "../model/types"
import { shiftDay, shiftWeek, thisMonday } from "../model/weeks"

/** 팀원 여덟 명. 첫 사람이 이 앱의 "나"다(업무의 나와 같은 사람). */
export const TEAM: readonly ReportMember[] = [
  { id: "person-0", name: "고재범", department: "개발팀" },
  { id: "person-1", name: "김하늘", department: "디자인팀" },
  { id: "person-2", name: "이도윤", department: "개발팀" },
  { id: "person-3", name: "박서준", department: "개발팀" },
  { id: "person-4", name: "최유진", department: "기획팀" },
  { id: "person-5", name: "정민호", department: "인프라팀" },
  { id: "person-6", name: "한소희", department: "QA팀" },
  { id: "person-7", name: "오세영", department: "기획팀" },
]
export const ME = TEAM[0]

/** 보고를 모아 둘 주의 수(이번 주 포함). */
export const WEEKS = 6

/** 사람마다 돌아가며 쓰는 일감. 주마다 셋씩 차례로 꺼내고, 다음 주의 일감이 이번 주의 차주 계획이 된다. */
const WORK: Record<string, readonly string[]> = {
  "person-0": [
    "**호호코워크** 주간보고 목록 불러오기 속도 개선(쿼리 2회 → 1회)", "**호호코워크** 결재함 반려 사유를 목록에 함께 보이기",
    "**호호코워크** Litestream 복구 절차 점검과 문서 정리", "**shadcn 재현** 페이지 틀(머리 줄 · 툴바 · 앱 바) 만들기",
    "**shadcn 재현** 필터 메뉴와 칩 줄을 공통 부품으로 빼기", "**호호코워크** MCP 문서 도구 응답 크기 제한 설정으로 빼기",
    "**코드 리뷰** 휴가 신청 결재선 변경 PR 검토", "**shadcn 재현** 업무 상세와 활동 붙이기",
    "**호호코워크** 업무 키(cowork-n) 번호 이어 매기기 마무리", "**채용** 백엔드 개발자 2차 면접 2건",
    "**shadcn 재현** 휴대폰 하단 탭과 더보기 시트", "**호호코워크** 공지사항 편집기 표 넣기 설계",
  ],
  "person-1": [
    "**디자인 시스템** 아이콘 규칙 문서 정리(Linear · Bold Duotone)", "**호호코워크** 보드 카드 우선순위 · 라벨 표시 시안",
    "**호호코워크** 빈 상태 그림 4종 다듬기", "**모바일** 하단 탭 위 만들기 버튼 위치 확정",
    "**호호코워크** 다크 모드 라벨 대비 점검", "**디자인 시스템** 속성 알약 상태별 모양 정리",
    "**호호타운** 캐릭터 표정 6종 추가", "**호호코워크** 주간보고 작성 단계 화면 시안",
    "**모바일** 필터 시트 2단계 흐름 정리", "**디자인 리뷰** 회의록 상세 화면 피드백 반영",
    "**호호코워크** 알림함 읽음 · 안 읽음 표시 시안", "**디자인 시스템** 큰 화면 글자 배율 확인",
  ],
  "person-2": [
    "**호호코워크** 팀 캘린더 휴가 하루 밀림 수정", "**MCP** 문서 도구가 긴 본문을 자르는 문제 원인 확인",
    "**호호코워크** GitLab 커밋을 업무 키로 잇기 1차", "**MCP** get_document_section 안내 문구 추가",
    "**호호코워크** 업무 알림 메일 발송 큐 정리", "**성능** 업무 목록 N+1 쿼리 제거",
    "**호호코워크** 반복 일정 적용 범위 묻기", "**MCP** 문서 이동 도구 권한 확인 추가",
    "**호호코워크** 첨부 업로드 재시도", "**성능** 문서함 트리 지연 불러오기",
    "**코드 리뷰** 주간보고 확인 처리 PR 검토", "**호호코워크** 회의록 참석자 알림",
  ],
  "person-3": [
    "**호호코워크** 에이전트 토큰 만들기 화면 다듬기", "**호호코워크** 표 뷰 머리 줄 고정",
    "**조직도** 팀원 검색 1차 구현", "**호호코워크** 일정 알림 시간 고르기",
    "**호호코워크** 표 뷰 열 너비 저장", "**조직도** 부서 이동 이력 보이기",
    "**호호코워크** 업무 대량 선택 바 정리", "**테스트** 업무 목록 E2E 시나리오 3건 추가",
    "**호호코워크** 프로젝트 별표 순서 바꾸기", "**조직도** 휴대폰 화면 정리",
    "**호호코워크** 키보드 단축키 도움말", "**테스트** 필터 · 정렬 단위 테스트 보강",
  ],
  "person-4": [
    "**기획** 주간보고 마감 앞당김 규칙 정리(공휴일 주)", "**기획** 휴가 · 연장근무 신청 단계 요구사항 확정",
    "**고객 인터뷰** 협력사 2곳 주간보고 사용 방식 조사", "**기획** 공지사항 대상 지정(부서 · 직급) 정의",
    "**기획** 호호타운 출석 보상 규칙 초안", "**운영** 11월 전사 공지 일정 정리",
    "**기획** 결재 위임 시나리오 정리", "**고객 인터뷰** 결과 정리와 우선순위 제안",
    "**기획** 문서함 권한 모델 검토", "**운영** 사내 설문(근무 환경) 문항 확정",
    "**기획** 회의록 템플릿 3종 정의", "**기획** 2027 상반기 로드맵 초안",
  ],
  "person-5": [
    "**인프라** 운영 DB 백업 주기 6시간 → 1시간", "**인프라** 스테이징 인증서 자동 갱신 점검",
    "**모니터링** 응답 지연 경보 기준 조정(p95 800ms)", "**인프라** 첨부 저장소 수명 주기 정책 적용",
    "**보안** 관리자 페이지 접근 IP 제한", "**인프라** 배포 파이프라인 캐시로 빌드 4분 단축",
    "**모니터링** 대시보드에 MCP 호출 수 추가", "**인프라** 로그 보관 30일 → 90일 비용 검토",
    "**보안** 취약점 점검 결과 조치 3건", "**인프라** 개발 서버 OS 업데이트",
    "**모니터링** 야간 장애 알림 당번표 정리", "**인프라** 복구 훈련(Litestream) 진행",
  ],
  "person-6": [
    "**QA** 업무 상세 회귀 테스트 42건", "**QA** 휴대폰 필터 시트 이슈 5건 등록",
    "**QA** 주간보고 작성 · 제출 시나리오 점검", "**자동화** 로그인 · 알림함 E2E 안정화",
    "**QA** 다크 모드 화면 전수 확인", "**QA** 결재함 반려 흐름 테스트",
    "**자동화** 일정 만들기 테스트 추가", "**QA** 큰 화면(2560px) 배율 점검",
    "**QA** 공지사항 편집기 붙여 넣기 테스트", "**자동화** CI 실패 원인 분류 표 정리",
    "**QA** 출시 전 체크리스트 진행", "**QA** 접근성(키보드 이동) 점검",
  ],
  "person-7": [
    "**운영** 신규 입사자 3명 계정 · 권한 준비", "**기획** 근태 화면 요구사항 정리",
    "**운영** 사내 교육(보안) 일정 안내", "**기획** 호호타운 이벤트 기획안",
    "**운영** 연말 평가 일정 공지 초안", "**기획** 구성원 프로필 항목 정리",
    "**운영** 법인카드 사용 내역 정리", "**기획** 알림 설정 항목 정리",
    "**운영** 사무실 이전 일정 조율", "**기획** 결재 양식 4종 정리",
    "**운영** 협력사 계약 갱신 확인", "**기획** 주간보고 열람 권한 정책 정리",
  ],
}

/** 가끔 남기는 비고: 건의 · 함께 검토할 일. */
const NOTES = [
  "> 스테이징 DB가 자주 느려집니다. 다음 주 초에 함께 원인을 보면 좋겠습니다.",
  "- 금요일 오후 반차 사용 예정입니다.\n- 리뷰 요청한 PR 두 건 확인 부탁드립니다.",
  "디자인 리뷰 일정을 **화요일 오후 2시**로 옮겼으면 합니다.",
  "외부 일정으로 수요일은 오전만 근무합니다.",
]

/** 이 주(오래된 순서 order)의 일감 셋. */
const itemsOf = (memberId: string, order: number) => {
  const pool = WORK[memberId]
  return [0, 1, 2].map(index => pool[(order * 3 + index) % pool.length])
}
const bullets = (items: string[]) => items.map(item => `- ${item}`).join("\n")

/** 이번 주(back 0)에 사람마다 어디까지 왔는지. 다른 사람의 작성 중은 보이지 않으므로 작성 전으로 둔다. */
const THIS_WEEK: Record<string, ReportState> = {
  "person-0": "none", "person-1": "submitted", "person-2": "confirmed", "person-3": "none",
  "person-4": "submitted", "person-5": "none", "person-6": "submitted", "person-7": "none",
}
/** 지난 주들 가운데 내지 않은 것. */
const MISSED = new Set(["person-5:3", "person-7:5", "person-3:1"])

/** 금요일 오후(지난 주) · 월요일 낮(이번 주, 어느 요일에 열어도 지난 시각)의 그럴듯한 제출 시각. */
const submittedAt = (weekStart: string, back: number, index: number) =>
  back === 0 ? `${weekStart}T${String(9 + index).padStart(2, "0")}:${String(10 + index * 7).padStart(2, "0")}:00+09:00`
    : `${shiftDay(weekStart, 4)}T${String(16 + (index % 3)).padStart(2, "0")}:${String(5 + index * 6).padStart(2, "0")}:00+09:00`

function reportOf(member: ReportMember, index: number, back: number, monday: string): WeeklyReport {
  const weekStart = shiftWeek(monday, -back)
  const order = WEEKS - 1 - back
  const state: ReportState = back === 0 ? THIS_WEEK[member.id] : MISSED.has(`${member.id}:${back}`) ? "none" : back === 1 && index % 3 === 1 ? "submitted" : "confirmed"
  const base = { id: `${weekStart}:${member.id}`, weekStart, author: member, isMine: member.id === ME.id, state }
  if (state === "none") return { ...base, thisWeek: "", nextWeek: "", note: "" }
  return {
    ...base,
    thisWeek: bullets(itemsOf(member.id, order)),
    nextWeek: bullets(itemsOf(member.id, order + 1)),
    note: (order + index) % 3 === 0 ? NOTES[(order + index) % NOTES.length] : "",
    submittedAt: isSubmitted(state) ? submittedAt(weekStart, back, index) : undefined,
    ...(state === "confirmed" ? {
      // 이번 주의 확인은 월요일 저녁, 지난 주들은 다음 주 월요일 아침. 내 보고는 기획팀장이, 팀원 보고는 내가 확인한다.
      confirmedAt: back === 0 ? `${weekStart}T18:20:00+09:00` : `${shiftWeek(weekStart, 1)}T09:30:00+09:00`,
      confirmedBy: member.id === ME.id ? "최유진" : ME.name,
    } : {}),
  }
}

/** 이번 주부터 WEEKS주 전까지 팀 전체의 보고. */
export function mockWeeklyReports(now: Date = new Date()): WeeklyReport[] {
  const monday = thisMonday(now)
  return Array.from({ length: WEEKS }, (_, back) => TEAM.map((member, index) => reportOf(member, index, back, monday))).flat()
}
