import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { KeyboardEvent, ReactNode } from 'react';
import { useIsPhone } from '../../foundations/media';
import { AppDialog } from './AppDialog';

/**
 * 몇 개의 칸으로 끝나는 짧은 양식(이름 바꾸기·추가·변경). 칸, 그 아래 실패 이유, 바닥의 취소·제출. 저장 중에는 닫기를
 * 막는다. 제출 버튼은 비활성화하지 않는다. 빠진 값은 onSubmit에서 칸 곁에 알리고(TextInput의 status) 초점을 옮긴다. 한 줄 입력에서 Enter는 제출한다(한글 조합 중 제외). 휴대폰에서는 전체 화면 대화상자다.
 * 제목과 본문이 있는 작성은 ComposeSurface를 쓴다.
 */
export function FormDialog({ title, subtitle, submitLabel, isPending = false, isDestructive = false,
  error, width = '30rem', onSubmit, onClose, children, footerStart }: {
  title: string; subtitle?: string; submitLabel: string; isPending?: boolean; isDestructive?: boolean;
  error?: string; width?: string; onSubmit: () => void; onClose: () => void; children: ReactNode; footerStart?: ReactNode;
}) {
  const isPhone = useIsPhone();
  const close = () => { if (!isPending) onClose(); };
  const enter = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || !(event.target instanceof HTMLInputElement)) return;
    event.preventDefault();
    if (!isPending) onSubmit();
  };
  return <AppDialog isOpen onOpenChange={open => { if (!open) close(); }} purpose="form" width={width}
    variant={isPhone ? 'fullscreen' : 'standard'} title={title} subtitle={subtitle} focusTitle={false} onFrameKeyDown={enter}
    footer={<HStack gap={2} hAlign={footerStart ? 'between' : 'end'} wrap="wrap">
      {footerStart}
      <HStack gap={2}>
        <Button label="취소" variant="ghost" onClick={close} isDisabled={isPending} />
        <Button label={submitLabel} variant={isDestructive ? 'destructive' : 'primary'} isLoading={isPending} onClick={onSubmit} />
      </HStack>
    </HStack>}>
    <VStack gap={4}>
      {children}
      {error ? <Text color="secondary" role="alert">{error}</Text> : null}
    </VStack>
  </AppDialog>;
}
