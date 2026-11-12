import { queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import { BellIcon, MessageCircleIcon, ShieldCheckIcon, UserIcon, type Icon } from '@/shared/ui/icon';

/** 알림: 다른 사람이나 시스템이 나에게 보낸 것. 처리 목록이라 하나씩 열어 확인하고 보관한다. */
export type NotificationKind = 'mention' | 'assign' | 'approval' | 'system';
export type Notification = {
  id: string; kind: NotificationKind; from: string; title: string;
  /** 알림이 가리키는 대상의 이름과 그 일부. */
  subject: string; excerpt: string; body: string; sentAt: string; archived: boolean;
};

/** 종류의 이름과 표식. */
export const kinds: Record<NotificationKind, { label: string; icon: Icon }> = {
  mention: { label: '멘션', icon: MessageCircleIcon },
  assign: { label: '배정', icon: UserIcon },
  approval: { label: '승인 요청', icon: ShieldCheckIcon },
  system: { label: '시스템', icon: BellIcon },
};

export const seedNotifications: Notification[] = [
  { id: 'n1', kind: 'approval', from: '지우', title: '지우님이 "가을 캠페인 일정" 승인을 요청했습니다', subject: '가을 캠페인 일정', archived: false,
    excerpt: '11월 셋째 주부터 예고 글을 내보내고, 둘째 주에 마감합니다.', body: '일정이 확정되어야 디자인 작업을 시작할 수 있습니다. 오늘 안에 확인해 주시면 감사하겠습니다.', sentAt: '2026-11-08T09:20:00Z' },
  { id: 'n2', kind: 'mention', from: '도현', title: '도현님이 "가입 흐름 점검" 대화에서 멘션했습니다', subject: '가입 흐름 점검', archived: false,
    excerpt: '@서윤 인증 메일이 늦게 오는 경우도 같이 봐 줄 수 있을까요?', body: '메일이 5분 넘게 걸리는 사례가 두 건 있었습니다. 재발송 문구를 어떻게 할지 의견이 필요합니다.', sentAt: '2026-11-08T08:05:00Z' },
  { id: 'n3', kind: 'assign', from: '하은', title: '하은님이 "알림 설정 화면" 작업을 배정했습니다', subject: '알림 설정 화면', archived: false,
    excerpt: '채널별로 알림을 끄고 켜는 화면을 만듭니다. 마감은 이번 주 금요일입니다.', body: '기획 문서는 링크에 있습니다. 모르는 부분은 먼저 댓글로 남겨 주세요.', sentAt: '2026-11-07T16:40:00Z' },
  { id: 'n4', kind: 'system', from: '시스템', title: '정기 점검이 11월 10일 새벽 2시에 있습니다', subject: '정기 점검 안내', archived: false,
    excerpt: '약 30분 동안 저장과 업로드가 잠시 멈춥니다.', body: '점검 중에는 읽기만 할 수 있습니다. 작성 중인 내용은 점검 전에 저장해 주세요.', sentAt: '2026-11-07T10:10:00Z' },
  { id: 'n5', kind: 'mention', from: '민준', title: '민준님이 "주간 회고" 문서에서 멘션했습니다', subject: '주간 회고', archived: false,
    excerpt: '@서윤 지난주 배포 이야기는 이 문단에 정리해 주세요.', body: '회고 마감은 목요일 오후입니다.', sentAt: '2026-11-06T13:30:00Z' },
  { id: 'n6', kind: 'approval', from: '서윤', title: '서윤님이 "분기 예산안" 승인을 요청했습니다', subject: '분기 예산안', archived: true,
    excerpt: '지난 분기보다 교육비를 10% 늘린 안입니다.', body: '승인하셨고 후속 작업은 끝났습니다.', sentAt: '2026-11-04T11:00:00Z' },
];
/** 처음부터 읽은 알림. 나머지는 열면 읽음이 된다. */
export const initiallyRead = ['n5', 'n6'];

/** 시각은 시간대와 무관하게 같은 글자가 나오도록 UTC로 적는다. */
export const timeText = (value: string) => new Intl.DateTimeFormat('ko', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value));

export interface NotificationApi {
  list(signal?: AbortSignal): Promise<Notification[]>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
export const NotificationApiContext = createContext<NotificationApi | null>(null);
export function useNotificationApi() {
  const api = useContext(NotificationApiContext);
  if (!api) throw new Error('NotificationApiContext가 필요합니다.');
  return api;
}
export const notificationKeys = { all: ['notifications'] as const };
export const notificationQueries = {
  all: (api: NotificationApi) => queryOptions({ queryKey: notificationKeys.all, queryFn: ({ signal }) => api.list(signal), staleTime: 30_000 }),
};

/** 읽음 표시는 앱 전체가 공유한다(메뉴의 안 읽은 수와 목록의 굵은 제목이 함께 바뀐다). 메모리에만 남는다. */
export const NotificationReadContext = createContext<{ read: ReadonlySet<string>; markRead: (id: string) => void } | null>(null);
export function useNotificationRead() {
  const value = useContext(NotificationReadContext);
  if (!value) throw new Error('NotificationReadContext가 필요합니다.');
  return value;
}
