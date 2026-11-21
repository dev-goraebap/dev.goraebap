import type { PushTone } from '../model/push-format';
import { PushToneBadge } from './PushToneBadge';

/** Each push's outcome, named for an administrator, with the colour of its token. */
const STATUS: Record<string, { label: string; color: PushTone }> = {
  SENT: { label: '전달됨', color: 'green' },
  PENDING: { label: '보내는 중', color: 'blue' },
  FAILED: { label: '실패', color: 'red' },
  GONE: { label: '구독 끝남', color: 'orange' },
  NO_DEVICE: { label: '기기 없음', color: 'gray' },
  MUTED: { label: '꺼 둔 알림', color: 'gray' },
};

/** A push's outcome as a small token; one this screen does not know shows as it is named. */
export function PushStatusToken({ status }: { status?: string | null }) {
  if (!status) return null;
  const known = STATUS[status];
  return <PushToneBadge label={known?.label ?? status} tone={known?.color ?? 'gray'} />;
}
