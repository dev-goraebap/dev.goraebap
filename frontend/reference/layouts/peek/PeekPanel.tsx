import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { LayoutPanel } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useEffect, useRef, type ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import styles from './peek.module.css';

/**
 * 목록 옆 미리보기 패널. 목록을 가리지 않고(비모달) 본문의 약 45%를 쓴다. 머리에는 대상 이름, 페이지로 열기, 닫기를 두고
 * Esc로도 닫는다(입력 칸·열린 대화상자 안의 Esc는 제외). 닫으면 초점을 미리보기하던 행(`data-peek-row`)으로 돌려준다.
 * 본문은 대상 페이지와 같은 부품을 넣는다. Page의 aside 자리에 둔다.
 */
export function PeekPanel({ id, title, pageHref, onClose, children }: {
  id: string; title: string; pageHref: string; onClose: () => void; children: ReactNode;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"], dialog[open]')) return;
      closeRef.current();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
  // 패널이 닫히면 초점을 그 행으로 돌린다(행이 남아 있을 때).
  useEffect(() => () => {
    requestAnimationFrame(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      const row = document.querySelector<HTMLElement>(`[data-peek-row="${CSS.escape(id)}"]`);
      (row?.matches('a[href]') ? row : row?.querySelector<HTMLElement>('a[href]') ?? row)?.focus();
    });
  }, [id]);
  return <LayoutPanel hasDivider width="45%" padding={0} role="complementary" label={`미리보기: ${title}`}>
    <VStack className={styles.panel}>
      <HStack className={styles.head} gap={2} vAlign="center" hAlign="between">
        <Text weight="semibold" maxLines={1}>{title}</Text>
        <HStack gap={1}>
          <IconButton label="페이지로 열기" tooltip="페이지로 열기" variant="ghost" size="sm" icon={icon('expand-page')} href={pageHref} />
          <IconButton label="미리보기 닫기" tooltip="닫기" variant="ghost" size="sm" icon={icon('close')} onClick={onClose} />
        </HStack>
      </HStack>
      <VStack className={styles.body}>{children}</VStack>
    </VStack>
  </LayoutPanel>;
}
