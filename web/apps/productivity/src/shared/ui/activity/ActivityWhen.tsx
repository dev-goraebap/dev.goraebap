import { formatActivityMoment, type ActivityItem } from './activity-item';

export function ActivityWhen({ item, isEdited = false }: { item: ActivityItem; isEdited?: boolean }) {
  return <time dateTime={item.at} title={new Date(item.at).toLocaleString('ko-KR')}
    className="text-xs whitespace-nowrap text-muted-foreground max-md:inline-block">
    {isEdited ? `${formatActivityMoment(item.at)} · 고침` : formatActivityMoment(item.at)}
  </time>;
}
