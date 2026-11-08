import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useMutation } from '@tanstack/react-query';
import { useSessionApi } from '../../entities/session';
import styles from '../../app/errors.module.css';

/**
 * 점검 중. 앱 셸에 들어갈 수 없는 상태라서 셸 없이 전체 화면에 표시와 상태 화면만 둔다. 다시 시도하면 서비스 상태를
 * 확인해 열렸으면 앱으로 돌아가고, 아직이면 그 자리에서 알린다.
 */
export function MaintenancePage({ onReopened }: { onReopened: () => void }) {
  const api = useSessionApi();
  const check = useMutation({
    mutationFn: () => api.checkService(),
    onSuccess: status => { if (status === 'up') onReopened(); },
  });
  const isStillDown = check.data === 'maintenance';
  return <main className={styles.bare}>
    <div className={styles.bareBrand}>{icon('document', true)}<Text weight="semibold">작업 공간</Text></div>
    <div className={styles.bareBody}>
      <PageState kind="error" title="점검 중입니다" description="서비스를 점검하고 있습니다. 잠시 후 다시 시도해 주세요."
        action={<VStack gap={3} hAlign="center">
          <Button label="다시 시도" variant="secondary" isLoading={check.isPending} onClick={() => check.mutate()} />
          {isStillDown ? <Text color="secondary" role="status">아직 점검 중입니다.</Text> : null}
          {check.isError ? <Text color="secondary" role="alert">상태를 확인하지 못했습니다. 다시 시도해 주세요.</Text> : null}
        </VStack>} />
    </div>
  </main>;
}
