import { createContext, useContext } from 'react';

/** 받은 요청: 다른 사람이 자료를 두고 나에게 보낸 것. 처리 목록이라 하나씩 열어 확인하고 넘어간다. */
export type RequestKind = 'review' | 'share' | 'comment';
export type ResourceRequest = { id: string; kind: RequestKind; from: string; resourceId: string; message: string; sentAt: string };

export const requestKinds: Record<RequestKind, string> = { review: '검토 요청', share: '공유', comment: '댓글' };

export const seedRequests: ResourceRequest[] = [
  { id: 'r1', kind: 'review', from: '지우', resourceId: 'seed-loading', message: '대기 화면 문구를 한 번 봐 주세요.', sentAt: '2026-11-08T09:20:00Z' },
  { id: 'r2', kind: 'share', from: '도현', resourceId: 'router', message: '주소 규칙을 정리할 때 참고하면 좋겠습니다.', sentAt: '2026-11-08T08:05:00Z' },
  { id: 'r3', kind: 'comment', from: '서윤', resourceId: 'type-rhythm', message: '본문을 16px로 올리면 읽기가 더 편할 것 같습니다.', sentAt: '2026-11-07T16:40:00Z' },
  { id: 'r4', kind: 'review', from: '지우', resourceId: 'quiet-colors', message: '색 기록에 사진 설명을 더했어요.', sentAt: '2026-11-07T10:10:00Z' },
  { id: 'r5', kind: 'share', from: '도현', resourceId: 'keyboard', message: '초점 이동을 점검할 때 같이 보면 좋습니다.', sentAt: '2026-11-06T13:30:00Z' },
];
/** 처음부터 읽은 요청. 나머지는 열면 읽음이 된다. */
export const initiallyRead = ['r4', 'r5'];

/** 읽음 표시는 예제 앱 전체가 공유한다(메뉴의 안 읽은 수와 목록의 바탕이 함께 바뀐다). 메모리에만 남는다. */
export const RequestReadContext = createContext<{ read: ReadonlySet<string>; markRead: (id: string) => void } | null>(null);
export function useRequestRead() {
  const value = useContext(RequestReadContext);
  if (!value) throw new Error('RequestReadContext가 필요합니다.');
  return value;
}
