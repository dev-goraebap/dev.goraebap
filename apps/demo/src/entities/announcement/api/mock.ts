import type { Announcement, AnnouncementCategory, AnnouncementFile, Person } from "../model/types"

/** 공지를 쓴 사람들. 아이디는 업무의 사람과 같아 아바타 그림도 같다. */
export const AUTHORS: readonly Person[] = ["고재범", "김하늘", "이도윤", "박서준", "최유나", "정민호"].map((name, index) => ({ id: `person-${index}`, name }))
/** 이 앱의 "나". 새 공지의 작성자다. */
export const ME = AUTHORS[0]

const file = (id: string, name: string, size: number): AnnouncementFile => ({ id, name, size, isImage: /\.(png|jpe?g|webp|gif)$/i.test(name) })

type Seed = {
  title: string; category: AnnouncementCategory; author: number; at: string; reads: number
  isPinned?: boolean; isImportant?: boolean; isRead?: boolean; files?: AnnouncementFile[]; body: string
}

/** 게시일이 오래된 것부터. 둘은 고정, 하나는 중요 공지이고, 몇 개는 아직 읽지 않았다. */
const SEEDS: Seed[] = [
  {
    title: "2025년 연말정산 서류 제출 안내", category: "hr", author: 4, at: "2025-12-22T10:00:00+09:00", reads: 41, isRead: true,
    files: [file("f-1", "연말정산_제출서류_목록.pdf", 412_000)],
    body: `연말정산 서류를 **1월 16일(금)**까지 제출해 주세요.

## 제출 방법
- 홈택스 간소화 자료를 PDF로 내려받아 인사팀 메일로 보냅니다
- 의료비 · 기부금 영수증은 원본을 함께 제출합니다

> 기한을 넘기면 2월 급여에 반영되지 않습니다.`,
  },
  {
    title: "신년 워크숍 장소와 일정", category: "event", author: 1, at: "2026-01-08T14:30:00+09:00", reads: 38, isRead: true,
    body: `신년 워크숍은 **1월 23일(금)** 가평 연수원에서 엽니다.

1. 오전 9시 회사 앞에서 버스로 출발합니다
2. 오후에는 팀별로 올해 목표를 나눕니다
3. 저녁 식사 뒤 7시에 돌아옵니다`,
  },
  {
    title: "사내 메신저 비밀번호 정책 변경", category: "system", author: 2, at: "2026-03-03T09:00:00+09:00", reads: 44, isRead: true,
    body: `3월 10일부터 사내 메신저 비밀번호는 **12자 이상**이어야 합니다. 기존 비밀번호가 짧으면 다음 로그인 때 바꾸라는 안내가 나옵니다.

## 바뀌는 점
- 영문 · 숫자 · 기호 중 두 가지 이상을 섞습니다
- 90일마다 바꾸던 규칙은 없앱니다

자세한 내용은 \`보안 정책 v3\` 문서를 봐 주세요.`,
  },
  {
    title: "여름 휴가 신청은 6월 말까지", category: "hr", author: 4, at: "2026-06-02T11:00:00+09:00", reads: 40, isRead: true,
    body: `여름 휴가는 **7월 1일부터 8월 31일** 사이에 쓰며, 신청은 6월 30일까지 휴가 메뉴에서 받습니다. 같은 팀에서 같은 주에 절반 이상 쉬지 않도록 팀장과 미리 맞춰 주세요.`,
  },
  {
    title: "건강검진 대상자와 예약 방법", category: "welfare", author: 4, at: "2026-08-18T10:00:00+09:00", reads: 35, isRead: true,
    files: [file("f-2", "2026_건강검진_대상자.xlsx", 58_000), file("f-3", "검진기관_목록.pdf", 1_480_000)],
    body: `올해 건강검진 대상자는 첨부 파일에서 확인할 수 있습니다. 예약은 검진 기관에 직접 하고, 검진일은 공가로 처리합니다.

- 기한: **11월 28일**까지
- 비용: 기본 항목은 회사가 부담합니다`,
  },
  {
    title: "추석 연휴 서버 점검 일정", category: "system", author: 2, at: "2026-09-22T17:00:00+09:00", reads: 33, isRead: true,
    body: `추석 연휴 중 **9월 26일 오전 2시부터 6시**까지 서버를 점검합니다. 그동안 호호코워크와 메일에 접속할 수 없습니다.`,
  },
  {
    title: "사무실 3층 회의실 공사 안내", category: "general", author: 3, at: "2026-10-13T09:30:00+09:00", reads: 29, isRead: true,
    files: [file("f-4", "3층_공사_구역.png", 820_000)],
    body: `10월 20일부터 2주 동안 3층 큰 회의실을 고칩니다. 공사 중에는 5층 회의실을 예약해 써 주세요. 첨부한 그림에 막히는 통로를 표시했습니다.`,
  },
  {
    title: "11월 전사 회의 안내", category: "general", author: 0, at: "2026-10-30T15:00:00+09:00", reads: 27, isRead: true,
    body: `11월 전사 회의는 **11월 14일(금) 오후 4시**에 5층 큰 회의실에서 합니다. 원격 참석 링크는 일정에 붙여 두었습니다.

## 순서
- 3분기 실적 돌아보기
- 새 프로젝트 소개
- 묻고 답하기`,
  },
  {
    title: "법인카드 사용 규정 개정", category: "hr", author: 5, at: "2026-11-03T10:00:00+09:00", reads: 22, isRead: false, isImportant: true,
    files: [file("f-5", "법인카드_사용규정_개정본.pdf", 236_000)],
    body: `11월 10일부터 법인카드 규정이 바뀝니다. 바뀐 규정은 첨부 파일을 봐 주세요.

## 주요 변경
1. 1인 식대 한도를 **2만 원**으로 올립니다
2. 영수증은 사용한 날로부터 7일 안에 올립니다
3. 주말 사용은 사전 승인이 있어야 합니다`,
  },
  {
    title: "독감 예방접종 지원", category: "welfare", author: 4, at: "2026-11-05T13:00:00+09:00", reads: 18, isRead: false,
    body: `올해도 독감 예방접종 비용을 지원합니다. 접종 후 영수증을 복지 신청에 올리면 다음 달 급여에 함께 지급합니다. 가족은 1인당 2만 원까지입니다.`,
  },
  {
    title: "호호코워크 새 기능: 회의록 자동 요약", category: "system", author: 1, at: "2026-11-09T10:30:00+09:00", reads: 15, isRead: false, isPinned: true,
    body: `이제 회의 녹음을 올리면 받아쓴 내용으로 **회의록이 자동으로 만들어집니다.**

## 쓰는 방법
1. 회의록에서 새 회의록을 누릅니다
2. 녹음 파일과 회의 일시를 고릅니다
3. 몇 분 뒤 안건 · 결정 사항 · 할 일이 정리된 회의록이 보입니다

> 녹음 파일은 받아쓴 뒤 지웁니다.`,
  },
  {
    title: "연말 휴무와 송년회 일정", category: "event", author: 0, at: "2026-11-11T09:00:00+09:00", reads: 9, isRead: false, isPinned: true,
    files: [file("f-6", "송년회_초대장.png", 1_120_000)],
    body: `올해 마지막 주(**12월 29일 ~ 31일**)는 전사 휴무입니다. 송년회는 12월 19일(금) 저녁 6시 30분에 합니다.

- 장소: 성수동 한식당(지도는 첨부한 초대장에)
- 참석 여부는 12월 12일까지 댓글 대신 설문으로 받습니다`,
  },
]

export function mockAnnouncements(): Announcement[] {
  return SEEDS.map((seed, index) => ({
    id: String(101 + index),
    title: seed.title,
    category: seed.category,
    isPinned: seed.isPinned ?? false,
    isImportant: seed.isImportant ?? false,
    author: AUTHORS[seed.author],
    publishedAt: seed.at,
    updatedAt: seed.at,
    readCount: seed.reads,
    isRead: seed.isRead ?? true,
    body: seed.body,
    attachments: seed.files ?? [],
  }))
}
