import { useMemo, useState } from 'react';
import { useIsMobile } from '@/shared/lib/use-mobile';
import type { MenuAction } from '@/shared/ui/kit/action-menu';
import type { BodyTools } from '@/shared/ui/rich-body';

/**
 * 업무 본문(RichBody)이 도구를 둘 자리(BodyToolsContext). slot: 소속 줄 끝(… 앞), 댓글 · 버전 기록 · 편집과 고치는 동안의 저장 ·
 * 완료가 선다. foot: 휴대폰에서 고치는 동안의 저장 · 완료가 서는 바닥 줄로, 본문 스크롤 맨 아래에 붙어 늘 보이고 비면 숨는다.
 * menuActions: 본문이 페이지 메뉴(…)에 덧붙이는 것(휴대폰의 버전 기록).
 * 이 화면을 품는 페이지 머리(DetailSurface)는 이 기능 밖이라, 도구는 상세 자신의 머리 줄에 둔다.
 */
export function useBodyToolPlaces() {
  const isPhone = useIsMobile();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [footSlot, setFootSlot] = useState<HTMLElement | null>(null);
  const [menuActions, setMenuActions] = useState<MenuAction[]>([]);
  const tools = useMemo<BodyTools>(() => ({ slot, foot: isPhone ? footSlot : null, setMenuActions }), [slot, footSlot, isPhone]);
  const foot = isPhone
    ? <div ref={setFootSlot} role="region" aria-label="본문 저장"
      className="sticky bottom-0 z-10 flex shrink-0 items-center justify-end gap-2 border-t bg-background px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] empty:hidden *:h-11 *:min-w-22 *:last:flex-1" />
    : null;
  return { tools, setSlot, menuActions, foot };
}
