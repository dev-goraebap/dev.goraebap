import { cn } from 'cn';
import { Badge } from '@/shared/ui/kit/badge';

/** 색이 뜻을 거드는 짧은 낱말의 색: 분류 토큰(라이트 · 다크 모두 읽히는 옅은 바탕과 그 글자색)으로 그린다. */
export type Tone = 'blue' | 'green' | 'red' | 'gray' | 'purple' | 'orange';
const TONES: Record<Tone, string> = {
  blue: 'bg-event-blue text-event-blue-foreground',
  green: 'bg-event-green text-event-green-foreground',
  red: 'bg-event-red text-event-red-foreground',
  gray: 'bg-event-gray text-event-gray-foreground',
  purple: 'bg-event-purple text-event-purple-foreground',
  orange: 'bg-event-orange text-event-orange-foreground',
};

/** 옅은 색 알약에 담은 짧은 낱말(업무 배정, 실패 …). 색은 낱말이 말하는 것을 되풀이할 뿐이다. */
export function ToneBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return <Badge className={cn(TONES[tone], className)}>{label}</Badge>;
}
