import { useMaskedDialog } from '@/shared/lib/panel';
import { HistoryIcon } from '@/shared/ui/kit/icon';
import { pillVariants } from '@/shared/ui/kit/property-pill';
import { useBodyVersions } from './outline-context';

/** 정보 묶음의 버전 줄: 남은 버전 수, 누르면 버전 기록(주소 있는 대화상자 …/history). 버전이 없으면 그리지 않는다. */
export function BodyVersions() {
  const count = useBodyVersions();
  const history = useMaskedDialog('history');
  if (!count) return null;
  return <button type="button" data-slot="property-pill" aria-label="버전" className={pillVariants()} onClick={history.open}>
    <HistoryIcon /><span className="min-w-0 truncate">{`버전 ${count}개`}</span>
  </button>;
}
