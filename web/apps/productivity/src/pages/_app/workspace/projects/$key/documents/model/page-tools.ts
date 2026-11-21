import { useMemo, useState } from 'react';
import type { MenuAction } from '@/shared/ui/kit/action-menu';
import type { BodyTools } from '@/shared/ui/rich-body';

/** 라우터가 넘기는 경로 한 단계: 아이콘은 의미 이름이다(키트 Page에는 pageCrumbs로 바꿔 넘긴다). */
export type Crumb = { label: string; href?: string; icon?: string };

/**
 * 본문(RichBody)에 빌려줄 페이지의 자리(BodyToolsContext): 머리 줄 끝의 도구 자리(slot), 휴대폰 바닥 줄(foot), 페이지 메뉴(…)에
 * 본문이 덧붙이는 항목(extras). 키트 Page는 자리를 따로 두지 않으므로, 화면이 머리 줄 동작과 바닥 줄에 빈 칸을 두고 그 칸을 ref로 건넨다.
 */
export function usePageTools() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [foot, setFoot] = useState<HTMLElement | null>(null);
  const [extras, setExtras] = useState<MenuAction[]>([]);
  const tools = useMemo<BodyTools>(() => ({ slot, foot, setMenuActions: setExtras }), [slot, foot]);
  return { tools, setSlot, setFoot, extras };
}
