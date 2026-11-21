import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { changeComment, refreshWorkItems, timelineOptions, type TimelineEntry } from '@/entities/work-item';
import { sessionOptions } from '@/shared/auth';
import { ActivityFeed, type ActivityItem } from '@/shared/ui/activity';
import { activityIcon, activityText } from '../model/timeline-text';

/**
 * The work item's 활동 (the common activity): what happened to it and its discussion on one rule, oldest first, the box
 * to comment at the foot for who may comment (the project's members, viewers too, while it is not archived). A comment's
 * writer changes or deletes it, and the project's administrators delete any. onQuote shows in the body the words a
 * comment quotes.
 */
export function WorkItemTimeline({ projectKey, number, canComment, canModerate, onQuote }: {
  projectKey: string; number: number; canComment: boolean; canModerate: boolean; onQuote?: (quote: string, blockId?: string) => void;
}) {
  const client = useQueryClient();
  const timeline = useQuery(timelineOptions(projectKey, number));
  const session = useQuery(sessionOptions()).data;
  const [error, setError] = useState<string>();
  const run = (change: Parameters<typeof changeComment>[2]) => {
    setError(undefined);
    return changeComment(projectKey, number, change)
      .catch((failure: Error) => { setError(failure.message); throw failure; })
      .finally(() => refreshWorkItems(client));
  };
  return <ActivityFeed items={(timeline.data ?? []).map(itemOf)} meId={session?.id} canWrite={canComment}
    canModerate={canModerate} error={error ?? timeline.error?.message} onQuote={onQuote}
    onComment={(text, parentId) => run({ text, parentId })} onEdit={(commentId, text) => run({ commentId, text })}
    onDelete={commentId => run({ commentId, isDeleting: true })} />;
}

function itemOf(entry: TimelineEntry): ActivityItem {
  return entry.kind === 'COMMENT'
    ? { id: entry.id, kind: 'comment', at: entry.at, actorId: entry.actorId, actorName: entry.actorName, agent: entry.agent, body: entry.body, quote: entry.quote, editedAt: entry.editedAt, parentId: entry.parentId,
      blockId: entry.blockId, resolvedAt: entry.resolvedAt }
    : { id: entry.id, kind: 'event', at: entry.at, actorId: entry.actorId, actorName: entry.actorName, agent: entry.agent, text: activityText(entry), icon: activityIcon(entry),
      // 사람 없이 남은 상태 변경은 Git 연동이 MR 열림·병합에 맞춰 칸을 옮긴 것이다(서버 CodeInbound → moveByRule).
      ...(!entry.actorId && entry.kind === 'ACTIVITY' && entry.field === 'STATUS' ? { system: { name: 'Git 연동', icon: 'branch' } } : {}) };
}
