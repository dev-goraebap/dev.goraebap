import { activityIcon, activityText, useAddWorkItemComment, useWorkItemActivity, type WorkItemActivity as Entry } from "@/entities/work-item"
import { ActivityFeed, type ActivityItem } from "@/shared/ui/reading"
import { Skeleton } from "@/shared/ui/skeleton"

const itemOf = (entry: Entry): ActivityItem => entry.kind === "comment"
  ? { id: entry.id, kind: "comment", at: entry.at, actorName: entry.actor.name, body: entry.body }
  : { id: entry.id, kind: "event", at: entry.at, actorName: entry.actor.name, text: activityText(entry), icon: activityIcon(entry) }

/** 업무의 활동: 만듦 · 속성 바꿈 · 댓글을 한 선에, 끝에 댓글 입력. 보낸 댓글은 활동 끝에 붙는다. */
export function WorkItemActivity({ itemKey }: { itemKey: string }) {
  const activity = useWorkItemActivity(itemKey)
  const comment = useAddWorkItemComment()
  return (
    <ActivityFeed items={(activity.data ?? []).map(itemOf)} onComment={body => comment.mutateAsync({ key: itemKey, body })}
      empty={activity.isPending && (
        <div aria-busy="true" aria-label="활동을 읽는 중" className="flex flex-col gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      )} />
  )
}
