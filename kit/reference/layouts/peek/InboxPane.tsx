import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { LayoutPanel } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useEffect, useRef, type ReactNode } from 'react';
import { PageState } from '../../composites/state/PageState';
import { icon } from '../../foundations/icons/solar-icon';
import styles from './peek.module.css';

/**
 * 처리 목록(받은 요청·알림·승인 대기)의 상세 칸. 목록 옆에 늘 있고, 고른 항목이 없으면 고르라는 빈 상태를 보인다. 행을
 * 누르면(어디를 눌러도) 이 칸에 그 항목이 열린다. 머리에는 ← 닫기(고른 것 없음으로), 항목 이름, 페이지로 열기를 두고 Esc로도
 * 닫는다. 닫으면 초점을 그 행(`data-peek-row`)으로 돌려준다. 휴대폰은 이 칸 없이 목록만 보이고 항목은 자기 페이지로 연다.
 * 작업 목록의 미리보기(행 클릭은 페이지, 버튼·Space로 엶)는 PeekPanel을 쓴다. Page의 aside 자리에 둔다.
 */
export function InboxPane({ id, title, pageHref, onClose, empty, children }: {
  /** 고른 항목. 없으면 빈 상태. */
  id?: string;
  title?: string;
  pageHref?: string;
  onClose: () => void;
  /** 고른 것이 없을 때의 안내. 예: { title: '요청을 선택해 주세요' } */
  empty: { title: string; description?: string };
  children?: ReactNode;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!id) return undefined;
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"], dialog[open]')) return;
      closeRef.current();
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
      // 항목을 닫으면 초점을 그 행으로 돌린다(행이 남아 있고 초점이 갈 곳을 잃었을 때).
      requestAnimationFrame(() => {
        if (document.activeElement && document.activeElement !== document.body) return;
        const row = document.querySelector<HTMLElement>(`[data-peek-row="${CSS.escape(id)}"]`);
        (row?.matches('a[href]') ? row : row?.querySelector<HTMLElement>('a[href]') ?? row)?.focus();
      });
    };
  }, [id]);
  return <LayoutPanel hasDivider width="55%" padding={0} role="complementary" label={id ? `미리보기: ${title ?? ''}` : '고른 항목'}>
    <VStack className={styles.panel}>
      {id ? <>
        <HStack className={styles.head} gap={2} vAlign="center" hAlign="between">
          <HStack gap={1} vAlign="center" className={styles.title}>
            <IconButton label="고른 항목 닫기" tooltip="닫기 (Esc)" variant="ghost" size="sm" icon={icon('back')} onClick={onClose} />
            <Text weight="semibold" maxLines={1}>{title}</Text>
          </HStack>
          {pageHref ? <IconButton label="페이지로 열기" tooltip="페이지로 열기" variant="ghost" size="sm" icon={icon('expand-page')} href={pageHref} /> : null}
        </HStack>
        <VStack className={styles.body}>{children}</VStack>
      </> : <VStack className={styles.body}><PageState kind="empty" isCompact title={empty.title} description={empty.description} /></VStack>}
    </VStack>
  </LayoutPanel>;
}
