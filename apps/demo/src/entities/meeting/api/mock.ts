import type { Meeting, MeetingActionItem, MeetingStatus, Person, TranscriptLine } from "../model/types"

/** 회의에 나오는 사람들. 아이디는 업무 · 공지의 사람과 같다. */
export const PEOPLE: readonly Person[] = ["고재범", "김하늘", "이도윤", "박서준", "최유나", "정민호"].map((name, index) => ({ id: `person-${index}`, name }))
/** 이 앱의 "나". 새 회의록을 만든 사람이다. */
export const ME = PEOPLE[0]
export const PROJECTS = ["cowork", "호호오피스", "모바일 앱"] as const

const who = (...indexes: number[]) => indexes.map(index => PEOPLE[index])
const act = (text: string, owner?: number, due?: string): MeetingActionItem => ({ text, owner: owner === undefined ? undefined : PEOPLE[owner], due })

type Seed = {
  title: string; day: string; from: string; to: string; author: number; attendees: number[]; project?: string; status?: MeetingStatus
  summary?: string; agenda?: string[]; decisions?: string[]; actions?: MeetingActionItem[]; note?: string; transcript?: TranscriptLine[]; failure?: string
}

const SEEDS: Seed[] = [
  {
    title: "4분기 로드맵 정리", day: "2026-10-06", from: "10:00", to: "11:30", author: 0, attendees: [0, 1, 2, 3], project: "cowork",
    summary: "4분기에 낼 기능을 세 묶음으로 나누고, 휴대폰 화면을 가장 먼저 내기로 했다.",
    agenda: ["3분기 출시 돌아보기", "4분기 기능 후보와 순서", "인력 배치"],
    decisions: ["휴대폰 하단 탭과 만들기 버튼을 10월 안에 낸다", "문서함 끌어서 옮기기는 내년 1분기로 미룬다"],
    actions: [act("휴대폰 화면 설계안 공유", 1, "2026-10-10"), act("로드맵 문서를 문서함에 올리기", 0, "2026-10-08")],
  },
  {
    title: "디자인 시스템 아이콘 규칙", day: "2026-10-14", from: "14:00", to: "15:00", author: 1, attendees: [1, 3], project: "cowork",
    summary: "아이콘을 Solar 하나로 통일하고, 고른 상태는 같은 아이콘의 Bold Duotone으로 그리기로 했다.",
    agenda: ["지금 섞여 있는 아이콘 세트", "고른 상태의 표현"],
    decisions: ["기본은 Linear, 고름 · 열림 · 지금 자리는 Bold Duotone", "13px 글자 옆 아이콘은 16px"],
    actions: [act("아이콘 규칙을 DESIGN.md에 적기", 1, "2026-10-17")],
  },
  {
    title: "주간 팀 회의 (10월 셋째 주)", day: "2026-10-20", from: "09:30", to: "10:00", author: 2, attendees: [0, 1, 2, 3],
    summary: "지난주 버그 수정 상황을 나누고, 캘린더 휴가 버그를 이번 주 안에 고치기로 했다.",
    agenda: ["지난주 한 일", "이번 주 할 일", "막힌 일"],
    decisions: ["캘린더 휴가 일정이 하루 밀리는 문제를 가장 먼저 고친다"],
    actions: [act("날짜만 있는 일정을 그대로 내려주도록 서버 수정", 2, "2026-10-22"), act("휴가 일정 회귀 시험 추가", 3)],
  },
  {
    title: "법인카드 규정 개정 검토", day: "2026-10-23", from: "16:00", to: "17:00", author: 5, attendees: [4, 5, 0], project: "호호오피스",
    summary: "식대 한도와 영수증 제출 기한을 바꾸는 개정안을 검토했다. 공지는 11월 초에 낸다.",
    agenda: ["식대 한도", "영수증 제출 기한", "주말 사용 승인"],
    decisions: ["1인 식대 한도를 2만 원으로 올린다", "영수증은 7일 안에 올린다"],
    actions: [act("개정 규정 공지 작성", 5, "2026-11-03"), act("결재 양식에 주말 사용 사전 승인 칸 추가", 4)],
  },
  {
    title: "모바일 앱 출시 일정 점검", day: "2026-10-28", from: "11:00", to: "12:00", author: 3, attendees: [1, 3, 5], project: "모바일 앱",
    summary: "앱 심사 일정을 고려해 출시를 2주 미루고, 그사이 푸시 알림을 마무리하기로 했다.",
    agenda: ["스토어 심사 일정", "푸시 알림 진행 상황", "베타 테스트 결과"],
    decisions: ["출시일을 11월 24일로 옮긴다", "베타 테스터를 20명으로 늘린다"],
    actions: [act("푸시 알림 설정 화면 마무리", 3, "2026-11-14"), act("베타 테스터 모집 공지", 1, "2026-11-04")],
  },
  {
    title: "3층 회의실 공사 중 공간 운영", day: "2026-11-02", from: "10:00", to: "10:30", author: 3, attendees: [3, 4],
    summary: "공사 기간 동안 5층 회의실 예약을 팀별로 나누어 쓰기로 했다.",
    agenda: ["5층 회의실 예약 규칙"],
    decisions: ["오전은 개발팀, 오후는 운영팀이 먼저 예약한다"],
    actions: [act("예약 규칙을 일정에 공지", 3)],
  },
  {
    title: "회의록 자동 요약 기능 리뷰", day: "2026-11-05", from: "15:00", to: "16:30", author: 1, attendees: [0, 1, 2], project: "cowork",
    summary: "받아쓰기 정확도와 요약 형식을 검토했다. 할 일에는 담당과 기한을 붙여 보이기로 했다.",
    agenda: ["받아쓰기 정확도", "요약 형식", "녹음 파일 보관"],
    decisions: ["할 일에는 담당과 기한을 함께 적는다", "녹음 파일은 받아쓴 뒤 지운다"],
    actions: [act("요약 지침에 할 일 형식 추가", 2, "2026-11-07"), act("새 기능 공지 작성", 1, "2026-11-09")],
    transcript: [
      { startMs: 4_000, speaker: "김하늘", text: "오늘은 자동 요약이 실제 회의에서 얼마나 쓸 만한지 보려고 해요." },
      { startMs: 19_000, speaker: "이도윤", text: "받아쓰기는 사람 이름을 가끔 틀리는데, 참석자 이름을 미리 넘기면 나아질 것 같습니다." },
      { startMs: 41_000, speaker: "고재범", text: "할 일은 누가 언제까지 하는지가 빠지면 다시 물어봐야 하니까 꼭 붙여 주세요." },
      { startMs: 63_000, speaker: "김하늘", text: "녹음 파일은 받아쓰고 나면 지우는 게 좋겠어요. 보관할 이유가 없으니까요." },
    ],
  },
  {
    title: "주간 팀 회의 (11월 둘째 주)", day: "2026-11-09", from: "09:30", to: "10:00", author: 2, attendees: [0, 1, 2, 3],
    summary: "모바일 앱 베타 피드백과 전사 회의 준비를 나눴다.",
    agenda: ["베타 피드백", "전사 회의 발표 준비"],
    decisions: ["전사 회의에서 cowork 새 기능을 5분 소개한다"],
    actions: [act("발표 자료 초안", 0, "2026-11-13")],
    transcript: [
      { startMs: 2_000, speaker: "이도윤", text: "베타에서 로그인 유지가 자꾸 풀린다는 말이 많았습니다." },
      { startMs: 15_000, speaker: "박서준", text: "토큰 갱신 주기를 확인해 볼게요. 이번 주 안에 답을 드리겠습니다." },
    ],
  },
  {
    title: "송년회 준비 회의", day: "2026-11-11", from: "17:00", to: "17:30", author: 0, attendees: [0, 4, 5], status: "summarizing",
    note: "장소 후보 두 곳과 예산을 정리해 주세요.",
  },
  {
    title: "고객사 요구사항 인터뷰", day: "2026-11-12", from: "10:00", to: "11:00", author: 5, attendees: [2, 5], project: "호호오피스", status: "failed",
    failure: "녹음 파일에서 말소리를 찾지 못했습니다.",
  },
]

export function mockMeetings(): Meeting[] {
  return SEEDS.map((seed, index) => ({
    id: String(201 + index),
    title: seed.title,
    status: seed.status ?? "completed",
    project: seed.project,
    author: PEOPLE[seed.author],
    createdAt: `${seed.day}T${seed.to}:00+09:00`,
    heldStart: `${seed.day}T${seed.from}:00+09:00`,
    heldEnd: `${seed.day}T${seed.to}:00+09:00`,
    attendees: who(...seed.attendees),
    agenda: seed.agenda ?? [],
    decisions: seed.decisions ?? [],
    actionItems: seed.actions ?? [],
    summary: seed.summary ?? "",
    note: seed.note,
    transcript: seed.transcript ?? [],
    failure: seed.failure,
    // 예시 회의록의 녹음은 받아쓴 뒤 지운 것으로 둔다(이름과 크기만).
    audio: { id: `audio-${201 + index}`, name: `${seed.day} ${seed.title}.m4a`, size: (18 + index * 7) * 1024 * 1024, type: "audio/mp4" },
    photos: [],
  }))
}
