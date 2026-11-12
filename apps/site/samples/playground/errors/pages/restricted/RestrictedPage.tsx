import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { Page } from '@/shared/ui/layouts/page/Page';
import { useMutation } from '@tanstack/react-query';
import { useSessionApi } from '../../entities/session';

/**
 * 권한 없음. 셸은 그대로 두고 본문만 상태 화면으로 바꾼다. 막힌 이유를 말하고, 할 수 있는 다음 행동인 권한 요청을 둔다.
 * 요청하면 같은 자리가 "보냄" 확인으로 바뀌고 다시 누르게 하지 않는다.
 */
export function RestrictedPage({ onLeave }: { onLeave: () => void }) {
  const api = useSessionApi();
  const request = useMutation({ mutationFn: () => api.requestAccess('plan') });
  return <Page crumbs={[{ label: '설계 문서' }]}>
    <PageState kind="error" title="이 문서를 볼 권한이 없습니다" description="설계 문서는 설계팀 구성원만 열 수 있습니다."
      action={request.isSuccess
        ? <VStack gap={3} hAlign="center">
          <Text color="secondary" role="status">권한 요청을 보냈습니다. 승인되면 알려 드립니다.</Text>
          <Button label="메모 쓰기로" variant="secondary" onClick={onLeave} />
        </VStack>
        : <VStack gap={3} hAlign="center">
          <Button label="권한 요청하기" variant="primary" isLoading={request.isPending} onClick={() => request.mutate()} />
          {request.isError ? <Text color="secondary" role="alert">요청을 보내지 못했습니다. 다시 시도해 주세요.</Text> : null}
        </VStack>} />
  </Page>;
}
