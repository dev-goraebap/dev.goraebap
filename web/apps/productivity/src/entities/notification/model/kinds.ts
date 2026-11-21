import type { Tone } from '@/shared/ui/tone-badge';

/** What a notice reports, as a short label and a token colour, read from its kind. */
const KINDS: Record<string, { label: string; color: Tone }> = {
  ISSUE_ASSIGNED: { label: '업무 배정', color: 'blue' },
};

/** A kind the screen does not know yet reads as a plain notice. */
export function kindOf(kind: string): { label: string; color: Tone } {
  return KINDS[kind] ?? { label: '알림', color: 'gray' };
}

/** Only links into this app are followed, so a stored link cannot send the member elsewhere. */
export const inAppLink = (link?: string) => (link && link.startsWith('/') && !link.startsWith('//') ? link : undefined);
