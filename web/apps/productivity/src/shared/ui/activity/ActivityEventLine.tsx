import { solarIcon } from '../icons';
import { activityActorName, type ActivityItem } from './activity-item';
import { ActivityActorPictures } from './ActivityActorPictures';
import { ActivityWhen } from './ActivityWhen';
import { TimelineItem } from './TimelineItem';

/** 실행 사용자와 에이전트의 표식을 함께 표시한다. */
export function ActivityEventLine({ item }: { item: ActivityItem }) {
  const EventIcon = solarIcon(item.icon ?? 'edit');
  return <TimelineItem mark={<EventIcon />}>
    <div className="flex items-start gap-2">
      <ActivityActorPictures item={item} />
      <p className="m-0 min-w-0 text-sm/5 break-keep wrap-anywhere text-muted-foreground max-md:leading-normal">
        <span className="font-medium text-foreground">{activityActorName(item)}</span>{` ${item.text ?? ''} · `}
        <ActivityWhen item={item} />
      </p>
    </div>
  </TimelineItem>;
}
