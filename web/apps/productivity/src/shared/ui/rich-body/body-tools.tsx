import { createContext, useContext, type ReactNode } from 'react';
import { cn } from 'cn';
import type { MenuAction } from '@/shared/ui/kit/action-menu';
import { Alert, AlertDescription, AlertTitle } from '@goraebap/ui-react/compact/alert';
import { InfoIcon, OctagonXIcon, TriangleAlertIcon } from '@/shared/ui/kit/icon';

/**
 * 본문(RichBody)을 품은 페이지가 본문에 빌려주는 자리. slot: 페이지 머리 끝, 본문의 도구(댓글 · 버전 기록 · 편집, 고치는 동안 저장 ·
 * 완료)를 그곳에 둔다. foot: 휴대폰 상세 · 수정 화면의 바닥 동작 줄, 고치는 동안의 저장 · 완료를 그곳에 둔다. setMenuActions: 페이지
 * 메뉴(…)에 본문이 덧붙이는 항목(휴대폰의 버전 기록). 페이지 밖(Provider 없음)이면 도구는 본문 머리 줄에 선다.
 */
export type BodyTools = { slot: HTMLElement | null; foot?: HTMLElement | null; setMenuActions?: (actions: MenuAction[]) => void };
export const BodyToolsContext = createContext<BodyTools | null>(null);
export const useBodyTools = () => useContext(BodyToolsContext);

const ICONS = { info: InfoIcon, warning: TriangleAlertIcon, error: OctagonXIcon } as const;

/** 본문 위의 알림 줄(다른 사람이 고치는 중, 저장 실패 · 충돌): 아이콘 · 제목 · 설명, 그 아래 동작 단추들. */
export function BodyBanner({ status, title, description, actions }: {
  status: keyof typeof ICONS; title: string; description?: string; actions?: ReactNode;
}) {
  const Icon = ICONS[status];
  return <Alert variant={status === 'error' ? 'destructive' : 'default'} role={status === 'info' ? 'status' : 'alert'}>
    <Icon className={cn(status === 'warning' && 'text-mark-high')} />
    <AlertTitle className="whitespace-normal">{title}</AlertTitle>
    {description ? <AlertDescription>{description}</AlertDescription> : null}
    {actions ? <div className="col-start-2 mt-1.5 flex flex-wrap items-center gap-2">{actions}</div> : null}
  </Alert>;
}
