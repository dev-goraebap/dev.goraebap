import { LabelDot } from '@/shared/ui/label-dot/LabelDot';

/** A label's exact saved colour as a dot. */
export function WorkItemLabelDot({ color }: { color?: string }) {
  return <LabelDot color={color} />;
}
