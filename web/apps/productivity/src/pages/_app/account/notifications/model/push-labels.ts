import type { PushTopic } from '@/features/push-device';

/** Each group of notices a member may take as a push, named and explained as the member meets it. */
export const topicLabels: Record<PushTopic, { label: string; description: string }> = {
  WORK_ITEM: { label: '업무', description: '나에게 업무가 배정되면 알려 줍니다.' },
};

/** How the last push to a device went. */
export const pushStatusLabels: Record<string, string> = {
  SENT: '전달됨', PENDING: '보내는 중', FAILED: '실패', GONE: '구독 끝남', NO_DEVICE: '기기 없음', MUTED: '꺼 둔 알림',
};

const moment = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const momentText = (iso?: string | null) => (iso ? moment.format(new Date(iso)) : '');
