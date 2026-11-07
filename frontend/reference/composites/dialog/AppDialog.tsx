import { Dialog, type DialogProps } from '@astryxdesign/core/Dialog';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useId, type KeyboardEventHandler, type ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import styles from './dialog.module.css';

export type AppDialogProps = Omit<DialogProps, 'padding' | 'position' | 'children'> & {
  title: string;
  subtitle?: string;
  /** 제목 앞(만들 곳을 나타내는 칩 등). */
  headerLeading?: ReactNode;
  /** 제목 대신 머리에 둘 내용(검색 칸 등). 이때 title은 접근 가능한 이름으로만 쓴다. */
  headerContent?: ReactNode;
  /** 닫기 앞의 머리 동작(크게 보기 등). */
  headerActions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  hasFooterDivider?: boolean;
  hasCloseButton?: boolean;
  /** 열릴 때 제목에 초점을 둔다. 첫 입력에 초점을 줄 양식은 끈다. */
  focusTitle?: boolean;
  onFrameKeyDown?: KeyboardEventHandler<HTMLElement>;
};

/**
 * 모든 대화상자가 쓰는 한 틀: 머리·스크롤 본문·선택적 바닥. 위에서 12dvh에 두고 아래에도 같은 여유를 남겨 긴 본문에서도
 * 제목·닫기·마지막 동작에 닿는다. 좌우와 바깥 안 여백 1rem, 머리 아래·본문 위 0.5rem. 닫기·Esc 뒤 초점은 연 요소로
 * 돌아간다(Astryx Dialog). 제품 화면은 Astryx Dialog를 직접 쓰지 않고 이 틀을 쓴다.
 */
export function AppDialog({ title, subtitle, headerLeading, headerContent, headerActions, footer, children,
  hasFooterDivider, hasCloseButton = true, focusTitle = true, onFrameKeyDown, className, maxHeight, ...dialog }: AppDialogProps) {
  const titleId = useId();
  const subtitleId = useId();
  const positioned = !dialog.isInline && dialog.variant !== 'fullscreen';
  const limit = 'calc(100dvh - 2 * var(--app-dialog-edge))';
  const requested = typeof maxHeight === 'number' ? `${maxHeight / 16}rem` : maxHeight;
  return <Dialog {...dialog} padding={0}
    className={[positioned ? styles.positioned : undefined, className].filter(Boolean).join(' ')}
    maxHeight={positioned ? requested ? `min(${requested}, ${limit})` : limit : maxHeight}
    aria-label={headerContent ? title : dialog['aria-label']}
    aria-labelledby={headerContent || dialog['aria-label'] ? undefined : titleId}
    aria-describedby={subtitle && !headerContent ? subtitleId : dialog['aria-describedby']}>
    <VStack className={styles.frame} data-fullscreen={dialog.variant === 'fullscreen' || undefined} onKeyDown={onFrameKeyDown}>
      <HStack as="header" className={styles.header} gap={3} vAlign="center">
        {headerLeading}
        <VStack className={styles.heading} gap={1}>
          {headerContent ?? <>
            <Heading level={2} id={titleId} tabIndex={-1} data-autofocus={focusTitle && !dialog.isInline || undefined}>{title}</Heading>
            {subtitle ? <Text id={subtitleId} size="sm" color="secondary">{subtitle}</Text> : null}
          </>}
        </VStack>
        {headerActions}
        {hasCloseButton ? <IconButton label="닫기" tooltip="닫기" size="sm" variant="ghost"
          icon={icon('close')} onClick={() => dialog.onOpenChange(false)} /> : null}
      </HStack>
      <VStack className={styles.body} isScrollable>{children}</VStack>
      {footer != null ? <VStack as="footer" className={styles.footer} data-divider={hasFooterDivider || undefined}>{footer}</VStack> : null}
    </VStack>
  </Dialog>;
}
