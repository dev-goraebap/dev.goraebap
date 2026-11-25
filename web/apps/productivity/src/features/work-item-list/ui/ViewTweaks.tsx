import { Button } from '@goraebap/ui-react/compact/button';
import { Spinner } from '@goraebap/ui-react/components/spinner';

/** 필터 개수와 관계없이 저장 가능한 뷰 변경을 도구 모음에서 저장한다. */
export function ViewTweaks({ isChanged, canSave, isSaving, onSave }: {
  isChanged: boolean; canSave: boolean; isSaving: boolean; onRevert: () => void; onSave: () => void;
}) {
  if (!isChanged || !canSave) return null;
  return <Button variant="view" className="px-3 max-md:h-8" disabled={isSaving} onClick={onSave}>
    {isSaving ? <Spinner data-icon="inline-start" /> : null}
    뷰에 저장
  </Button>;
}
