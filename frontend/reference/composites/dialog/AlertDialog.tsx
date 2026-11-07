import { Button, type ButtonProps } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { useId } from 'react';
import { useIsPhone } from '../../foundations/media';
import { AppDialog } from './AppDialog';

/**
 * 되돌리기 어려운 결정을 묻는 확인 창. 닫기 X와 제목 초점 없이 안전한 취소에 첫 초점을 둔다. 휴대폰에서는 버튼을
 * 세로로 쌓고 주 동작을 위에 둔다. 위치·여백은 AppDialog를 따른다.
 */
export function AlertDialog({ isOpen, title, description, cancelLabel = '취소', actionLabel, actionVariant = 'destructive',
  isActionLoading, onAction, onOpenChange, width = '25rem' }: {
  isOpen: boolean; title: string; description: string; cancelLabel?: string; actionLabel: string;
  actionVariant?: ButtonProps['variant']; isActionLoading?: boolean; onAction: () => void;
  onOpenChange: (isOpen: boolean) => void; width?: string;
}) {
  const descriptionId = useId();
  const isPhone = useIsPhone();
  const cancel = <Button key="cancel" label={cancelLabel} variant="ghost" data-autofocus onClick={() => onOpenChange(false)} />;
  const action = <Button key="action" label={actionLabel} variant={actionVariant} isLoading={isActionLoading} onClick={onAction} />;
  return <AppDialog isOpen={isOpen} title={title} width={width} purpose="form" role="alertdialog"
    aria-describedby={descriptionId} onOpenChange={onOpenChange} hasCloseButton={false} focusTitle={false}
    footer={<Stack direction={isPhone ? 'vertical' : 'horizontal'} hAlign={isPhone ? 'stretch' : 'end'} gap={2}>
      {isPhone ? [action, cancel] : [cancel, action]}
    </Stack>}>
    <Text id={descriptionId} color="secondary">{description}</Text>
  </AppDialog>;
}
