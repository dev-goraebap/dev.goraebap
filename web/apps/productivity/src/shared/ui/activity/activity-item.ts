/**
 * One entry of a timeline, as a domain gives it (결정기록 2026-11-04 공통 활동): something that happened (its sentence after
 * the name of who did it, and its icon) or a comment (its text, the words of the body it quotes, when it was edited, the
 * comment it replies to).
 */
export type ActivityItem = {
  id: string; kind: 'event' | 'comment'; at: string; actorId?: string; actorName?: string;
  text?: string; icon?: string; body?: string; quote?: string; editedAt?: string; parentId?: string;
  /** 본문 블록에 단 스레드의 첫 댓글이면 그 블록, 해결했으면 그때. */
  blockId?: string; resolvedAt?: string;
  agent?: { id?: string; name?: string; icon?: string; color?: string };
  /** 사람이 아닌 실행자(Git 연동 같은 자동 규칙): 사람 그림 대신 그 표식과 이름으로 보인다. */
  system?: { name: string; icon: string };
};

const when = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function formatActivityMoment(at: string): string {
  return when.format(new Date(at));
}

export function activityActorName(item: ActivityItem): string {
  return item.system ? item.system.name : `${item.actorName ?? '알 수 없는 사람'}${item.agent?.name ? ` · ${item.agent.name}` : ''}`;
}
