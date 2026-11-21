import { useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/kit/button';
import type { HtmlPage } from './store';

/**
 * 본문에 넣은 HTML 파일을 창 가득 크게 보는 창. 올린 사람의 스크립트가 들어 있을 수 있으므로 본문의 미리보기와 같은 격리된
 * 틀(sandbox, 같은 출처 권한 없음) 안에서만 그린다: 틀 안의 문서는 이 앱의 화면·쿠키·저장소에 닿지 못한다. Esc와 닫기로
 * 닫고, 초점 가두기는 <dialog>가 맡는다. 창을 거의 가득 채우는 카드에 머리 줄(이름 · 새 탭 · 닫기)과 틀을 둔다. 틀의 바탕은
 * 흰색이다: 올린 HTML은 대개 밝은 바탕을 전제로 하고, 바탕을 정하지 않은 문서가 어두운 화면에서 검은 글씨로 묻히지 않게.
 */
export default function HtmlViewer({ page, onClose }: { page: HtmlPage; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => element?.close();
  }, []);
  // 서버가 내주는 주소만 새 탭으로 연다(서버가 격리 정책을 붙여 준다). 저장 전의 임시 주소(blob:)는 새 탭에서 이 앱의
  // 출처로 열리므로 내놓지 않는다.
  const canOpenTab = page.src.startsWith('/api/');
  return <dialog ref={dialog} aria-label={`${page.title} 크게 보기`} onClose={onClose} onCancel={onClose}
    className="m-auto h-[94vh] max-h-none w-[min(96vw,100rem)] max-w-none flex-col overflow-hidden rounded-xl border bg-background p-0 text-foreground backdrop:bg-black/70 open:flex">
    <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
      <span className="truncate text-sm font-semibold">{page.title}</span>
      <div className="flex shrink-0 items-center gap-2">
        {canOpenTab && <Button variant="secondary" size="sm" onClick={() => window.open(page.src, '_blank', 'noopener,noreferrer')}>새 탭에서 열기</Button>}
        <Button variant="secondary" size="sm" onClick={onClose}>닫기</Button>
      </div>
    </div>
    <iframe src={page.src} title={page.title} className="min-h-0 w-full flex-1 border-0 bg-white"
      sandbox="allow-scripts allow-modals allow-forms allow-popups" referrerPolicy="no-referrer" />
  </dialog>;
}
