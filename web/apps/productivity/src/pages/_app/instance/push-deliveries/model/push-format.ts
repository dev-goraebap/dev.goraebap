export type PushTone = 'green' | 'blue' | 'red' | 'orange' | 'gray' | 'purple';

/** A token's colour as the schedule's category fills, which read in the light and dark themes alike. */
export const PUSH_TONE: Record<PushTone, string> = {
  green: 'bg-event-green text-event-green-foreground',
  blue: 'bg-event-blue text-event-blue-foreground',
  red: 'bg-event-red text-event-red-foreground',
  orange: 'bg-event-orange text-event-orange-foreground',
  gray: 'bg-event-gray text-event-gray-foreground',
  purple: 'bg-event-purple text-event-purple-foreground',
};

/** A raised surface: the week's tiles and each kind of notice (DESIGN.md 면 단계). */
export const PUSH_SURFACE = 'min-w-0 rounded-xl border bg-card p-4';

/** The member's name is a button whose ::after covers the row, so the whole row opens the member beside the list. */
export const PUSH_OPENS_ROW = 'min-w-0 truncate text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring';

const moment = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function formatPushMoment(iso?: string | null): string {
  return iso ? moment.format(new Date(iso)) : '-';
}
