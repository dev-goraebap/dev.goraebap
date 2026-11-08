import type { Message, Room, ThreadApi } from '../entities/thread';

export const seedRooms: Room[] = [
  { id: 'design', name: '디자인 검토', members: ['서윤', '지우', '도현', '하은'] },
  { id: 'release', name: '배포 점검', members: ['서윤', '도현', '민준'] },
];

const m = (id: string, author: string, sentAt: string, body: string): Message => ({ id, roomId: 'design', author, sentAt, body });
export const seedMessages: Message[] = [
  m('m1', '지우', '2026-11-06T05:02:00Z', '새 알림 설정 화면 시안을 올렸습니다.'),
  m('m2', '지우', '2026-11-06T05:03:00Z', '끄고 켜는 스위치를 채널별로 묶었어요.'),
  m('m3', '도현', '2026-11-06T06:20:00Z', '확인했습니다. 휴대폰에서도 같은 순서로 보이면 좋겠습니다.'),
  m('m4', '서윤', '2026-11-07T01:10:00Z', '@지우 어제 시안 기준으로 스위치 문구를 정리해 봤습니다.'),
  m('m5', '서윤', '2026-11-07T01:11:00Z', '"받기"와 "끄기"를 같은 자리에 두는 쪽이 읽기 편했어요.'),
  m('m6', '서윤', '2026-11-07T01:30:00Z', '점심 먹고 한 번 더 같이 봐요.'),
  m('m7', '지우', '2026-11-07T01:45:00Z', '좋아요. 오후 두 시에 어떠세요?'),
  m('m8', '하은', '2026-11-07T07:00:00Z', '오늘 안에 접근성 점검 결과도 공유드릴게요.'),
  m('m9', '도현', '2026-11-08T00:40:00Z', '아침에 확인해 보니 키보드로 스위치를 옮기는 순서가 어긋나 있었습니다.'),
  m('m10', '도현', '2026-11-08T00:42:00Z', '@서윤 이 부분은 서윤님이 보시는 게 빠를 것 같아요.'),
  m('m11', '서윤', '2026-11-08T01:05:00Z', '네, 지금 바로 고치겠습니다.'),
  m('m12', '지우', '2026-11-08T09:30:00Z', '수정본 올라오면 알려 주세요. 저는 문구 쪽을 이어서 보겠습니다.'),
];

/** 예제의 중간에 오는 새 글(서버가 보낸 것으로 본다). */
const incomingBody = '확인했습니다. 점검 결과를 정리해서 이어서 올리겠습니다.';

/**
 * 메모리에만 저장하는 모의 서버. 견본마다 새로 만든다. 본문에 "실패"가 든 메시지는 처음 보낼 때만 실패하고 다시 보내면
 * 들어간다. incomingAfter(ms)가 있으면 그 시간이 지난 뒤 처음 읽을 때 하은의 새 글 한 건이 함께 온다.
 */
export function createThreadApi({ delay = 150, incomingAfter, rooms = seedRooms, messages = seedMessages }: {
  delay?: number; incomingAfter?: number; rooms?: Room[]; messages?: Message[];
} = {}): ThreadApi {
  let items = structuredClone(messages);
  let clock = Date.parse('2026-11-08T10:00:00Z');
  const attempts = new Map<string, number>();
  const startedAt = Date.now();
  let isIncomingSent = false;
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>(resolve => setTimeout(resolve, delay));
    signal?.throwIfAborted();
  };
  return {
    async rooms(signal) { await wait(signal); return structuredClone(rooms); },
    async messages(roomId, signal) {
      await wait(signal);
      if (incomingAfter !== undefined && !isIncomingSent && Date.now() - startedAt >= incomingAfter) {
        isIncomingSent = true;
        clock += 60_000;
        items = [...items, { id: `in-${items.length}`, roomId: 'design', author: '하은', sentAt: new Date(clock).toISOString(), body: incomingBody }];
      }
      return structuredClone(items.filter(each => each.roomId === roomId));
    },
    async send(roomId, localId, body) {
      await wait();
      const count = (attempts.get(localId) ?? 0) + 1;
      attempts.set(localId, count);
      if (body.includes('실패') && count === 1) throw new Error('메시지를 보내지 못했습니다.');
      clock += 60_000;
      const message: Message = { id: crypto.randomUUID(), roomId, author: '서윤', sentAt: new Date(clock).toISOString(), body };
      items = [...items, message];
      return structuredClone(message);
    },
  };
}
