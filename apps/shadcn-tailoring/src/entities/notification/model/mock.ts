import type { Notification } from "./types"

/** 알림함의 모의 데이터. 최근 것이 먼저다. */
export const notifications: Notification[] = [
  {
    id: "n1", kind: "approval", title: "김민서 님의 연차 신청", meta: "11월 12일 · 1일", receivedAt: "오전 9:41", isUnread: true,
    requester: "김민서", team: "개발팀", period: "2026년 11월 12일(목) · 1일", reason: "가족 행사가 있어 하루 연차를 신청합니다.",
  },
  {
    id: "n2", kind: "approval", title: "박준호 님의 출장 신청", meta: "11월 17일~18일 · 부산", receivedAt: "오전 8:20", isUnread: true,
    requester: "박준호", team: "영업팀", period: "2026년 11월 17일(화)~18일(수) · 2일", reason: "부산 고객사 정기 점검과 신규 계약 협의 일정입니다.",
  },
  {
    id: "n3", kind: "notice", title: "11월 사내 교육 안내", meta: "공지 · 인사팀", receivedAt: "오전 8:02", isUnread: true,
    author: "인사팀", postedAt: "2026년 11월 11일",
    body: [
      "11월 사내 교육 일정을 안내합니다. 이번 달은 정보 보안 기본 교육과 신규 결재 시스템 사용법 두 과정을 진행합니다.",
      "정보 보안 교육은 전 직원 필수 과정이며 11월 20일까지 온라인으로 들으면 됩니다. 결재 시스템 교육은 11월 19일 오후 2시 대회의실에서 진행합니다.",
      "참석이 어려운 분은 소속 팀장에게 미리 알려 주세요.",
    ],
  },
  {
    id: "n4", kind: "event", title: "팀 주간 회의 일정이 바뀌었습니다", meta: "일정 · 내일 오전 10시", receivedAt: "오전 7:30", isUnread: true,
    date: "2026년 11월 12일(목)", hours: "오전 10:00~11:00", place: "3층 소회의실 B",
  },
  {
    id: "n5", kind: "mention", title: "결재선 미리보기에서 대리 결재자가 빠집니다", meta: "HOH-128 · 정하린 님이 회원님을 언급했습니다", receivedAt: "어제", isUnread: true,
    key: "HOH-128", workTitle: "결재선 미리보기에서 대리 결재자가 빠집니다", author: "정하린",
    comment: "@고재범 대리 결재자를 지정한 상태에서 미리보기를 열면 원래 결재자만 보입니다. 재현 순서를 본문에 적어 두었으니 확인 부탁드려요.",
  },
  {
    id: "n6", kind: "approval", title: "이도윤 님의 반차 신청", meta: "11월 14일 오후 · 0.5일", receivedAt: "어제", isUnread: false,
    requester: "이도윤", team: "디자인팀", period: "2026년 11월 14일(토) 오후 · 0.5일", reason: "병원 진료 예약이 있어 오후 반차를 신청합니다.",
  },
  {
    id: "n7", kind: "notice", title: "연말정산 서류 제출 안내", meta: "공지 · 재무팀", receivedAt: "어제", isUnread: false,
    author: "재무팀", postedAt: "2026년 11월 10일",
    body: [
      "올해 연말정산 서류를 12월 5일까지 제출해 주세요.",
      "의료비 · 교육비 · 기부금 영수증은 간소화 서비스에서 받은 PDF를 그대로 올리면 됩니다. 부양가족이 바뀐 분은 가족관계증명서를 함께 올려 주세요.",
    ],
  },
  {
    id: "n8", kind: "event", title: "2026 하반기 전사 타운홀", meta: "일정 · 11월 20일 오후 4시", receivedAt: "11월 9일", isUnread: false,
    date: "2026년 11월 20일(금)", hours: "오후 4:00~5:30", place: "본사 2층 라운지 · 온라인 동시 진행",
  },
  {
    id: "n9", kind: "mention", title: "알림함 목록 너비를 끌어서 조절", meta: "HOH-121 · 오세린 님이 회원님을 언급했습니다", receivedAt: "11월 7일", isUnread: false,
    key: "HOH-121", workTitle: "알림함 목록 너비를 끌어서 조절", author: "오세린",
    comment: "@고재범 최대 너비는 560px로 두고 좁은 화면에서는 비율로 줄이는 쪽으로 정리했습니다. 키보드 조작도 넣었어요.",
  },
  {
    id: "n10", kind: "approval", title: "최유나 님의 경비 청구", meta: "11월 4일 · 택시비 32,000원", receivedAt: "11월 6일", isUnread: false,
    requester: "최유나", team: "운영팀", period: "2026년 11월 4일(수)", reason: "고객사 야간 장애 대응 뒤 귀가 택시비를 청구합니다.", decision: "approved",
  },
  {
    id: "n11", kind: "notice", title: "사무실 네트워크 점검 안내", meta: "공지 · 총무팀", receivedAt: "11월 5일", isUnread: false,
    author: "총무팀", postedAt: "2026년 11월 5일",
    body: ["11월 8일(토) 오전 2시부터 4시까지 사무실 네트워크 장비를 점검합니다. 이 시간에는 사내 와이파이와 VPN을 쓸 수 없습니다."],
  },
]
