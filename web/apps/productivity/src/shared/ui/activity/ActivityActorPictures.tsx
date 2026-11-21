import { Mark } from '../mark-picker';
import { PersonAvatar } from '../person';
import { activityActorName, type ActivityItem } from './activity-item';

/** Who did it: the person's picture (or an automatic actor's mark), with the agent's mark tucked over its edge. */
export function ActivityActorPictures({ item }: { item: ActivityItem }) {
  return <span role="group" aria-label={activityActorName(item)} className="flex shrink-0 items-center">
    {item.system ? <Mark isCircular icon={item.system.icon} letter={item.system.name} /> : <PersonAvatar id={item.actorId} name={item.actorName} size={20} />}
    {item.agent ? <span className="z-1 -ml-1 inline-flex rounded-full bg-background ring-2 ring-background in-[article]:bg-card in-[article]:ring-card">
      <Mark isCircular icon={item.agent.icon ?? 'agent'} color={item.agent.color} letter={item.agent.name ?? 'AI'} />
    </span> : null}
  </span>;
}
