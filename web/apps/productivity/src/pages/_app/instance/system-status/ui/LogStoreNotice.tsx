import { Alert, AlertDescription, AlertTitle } from '@goraebap/ui-react/compact/alert';
import { TriangleAlertIcon } from '@/shared/ui/kit/icon';
import { momentText } from '../model/format';

/**
 * Said wherever the records cannot be read: the log store has a problem, the service itself goes on, and since when it
 * fails when the status knows.
 */
export function LogStoreNotice({ since }: { since?: string | null }) {
  return <Alert>
    <TriangleAlertIcon className="text-mark-high" />
    <AlertTitle>로그 저장소에 문제가 있어 기록을 불러오지 못했습니다</AlertTitle>
    <AlertDescription>
      {`서비스는 그대로 동작합니다. 문제가 이어지는 동안의 활동 · 오류 기록은 남지 않습니다.${since ? ` (${momentText(since)}부터)` : ''}`}
    </AlertDescription>
  </Alert>;
}
