import { Badge } from '@/shared/ui/kit/badge';
import { PUSH_TONE, type PushTone } from '../model/push-format';

export function PushToneBadge({ label, tone }: { label: string; tone: PushTone }) {
  return <Badge className={PUSH_TONE[tone]}>{label}</Badge>;
}
