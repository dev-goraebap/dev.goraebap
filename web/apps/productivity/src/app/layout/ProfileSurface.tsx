import { useIsMobile } from '@/shared/lib/use-mobile';
import { DetailSurface } from '@/shared/ui/kit/detail-surface';
import { Dialog, DialogBar, DialogBody, DialogContent } from '@goraebap/ui-react/compact/dialog';
import { Page, type Crumb } from '@/shared/ui/kit/layout/page';
import { PersonProfile } from './PersonProfile';

/**
 * A member's profile where a pressed avatar opens it: a dialog over the page in view on a desktop (title, 크게 보기,
 * 닫기 over a scrolling body), or on its own page (/workspace/members/{id}) on a phone or from a direct link: a desktop's
 * page is the detail frame with its round back.
 */
export function ProfileSurface({ employeeId, surface, crumbs = [], onClose, onExpand }: {
  employeeId: string; surface: 'dialog' | 'page'; crumbs?: Crumb[]; onClose: () => void; onExpand?: (id: string) => void;
}) {
  const isMobile = useIsMobile();
  const body = <div className="flex justify-center px-4 py-8 md:py-10">
    <div className="w-full max-w-160 min-w-0"><PersonProfile key={employeeId} employeeId={employeeId} /></div>
  </div>;
  const path = crumbs.length > 0 ? crumbs : [{ label: '프로필' }];
  if (isMobile) return <Page crumbs={path} isFullScreen>{body}</Page>;
  // 데스크톱 자기 페이지: 다른 상세와 같은 뒤로가기 틀(2026-11-15). 둥근 ← 는 경로의 위 단계(구성원)로.
  if (surface === 'page') return <DetailSurface surface="page" title="프로필" crumbs={path}>{body}</DetailSurface>;
  return <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
    <DialogContent showCloseButton={false}>
      <DialogBar title="프로필" onExpand={onExpand ? () => onExpand(employeeId) : undefined} />
      <DialogBody><PersonProfile key={employeeId} employeeId={employeeId} /></DialogBody>
    </DialogContent>
  </Dialog>;
}
