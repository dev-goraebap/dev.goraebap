import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DocumentEditor, PageLookMenu, type DocumentMode, type PageLayout } from '@/shared/ui/document';
import { FileTextIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import type { JSONContent } from '@tiptap/react';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useDocumentValue, usePageLook, useSaveDocumentValue } from '../app/store';
import { ModeSwitch } from './DocumentReadPage';

/**
 * 문서 수정: 대화상자 없이 전체 페이지에서 쓴다. 위에 서식 막대(왼쪽 확대/축소, 오른쪽 문서 설정 · 페이지 모양 · 페이지 / 페이지 없음), 아래에 제목 칸과 본문.
 * 페이지 모드는 종이 위에 쓰며 페이지 끝을 넘는 것은 다음 페이지로 넘어간다. 용지 · 여백 · 머리말 · 바닥글은 문서 설정 칸에서 바꾼다.
 * 머리 줄은 본문 수정 화면(BodyEditPage)과 같다: 저장 상태, 저장(Ctrl/⌘+S, 제자리), 취소(고친 것이 있으면 먼저 묻는다), 완료(저장하고 돌아간다).
 * 휴대폰은 바닥 줄에 저장 · 완료, 앱 바 ←가 취소다. 본문 칸의 높이를 편집기가 채우고 본문 · 설정 칸이 각자 스크롤하므로 BodyEditPage(읽는 폭 한 열)는 쓰지 않는다.
 */
export function DocumentEditPage() {
  const document = useDocumentValue();
  const save = useSaveDocumentValue();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(document.title);
  const [body, setBody] = useState<JSONContent>(document.body);
  const [setup, setSetup] = useState(document.setup);
  const [mode, setMode] = useState<DocumentMode>('pages');
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const [look, setLook] = usePageLook();
  const [isLeaveAsked, setLeaveAsked] = useState(false);
  const snapshot = (value: { title: string; body: JSONContent; setup: typeof setup }) => JSON.stringify({ title: value.title.trim(), body: value.body, setup: value.setup });
  const [saved, setSaved] = useState(() => snapshot(document));
  const current = { title: title.trim() || document.title, body, setup };
  const isDirty = snapshot(current) !== saved;
  const store = () => { save(current); setSaved(snapshot(current)); };
  const leave = () => void navigate({ href: '/documents/spec' });
  const cancel = () => { if (isDirty) setLeaveAsked(true); else leave(); };
  const done = () => { store(); leave(); };
  // Ctrl+S (⌘S)는 브라우저의 저장 대신 이 화면을 저장한다.
  const latest = useRef(store);
  latest.current = store;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') { event.preventDefault(); latest.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const status = <span role="status" className="text-xs text-muted-foreground">{isDirty ? '저장 안 됨' : '저장됨'}</span>;
  const saveButton = <Button variant="secondary" disabled={!isDirty} title="Ctrl+S" aria-keyshortcuts="Control+S Meta+S" className="max-md:h-11 max-md:px-4" onClick={store}>저장</Button>;
  const doneButton = <Button title="저장하고 돌아가기" className="max-md:h-11 max-md:flex-1" onClick={done}>완료</Button>;
  return (
    <Page crumbs={[{ label: '문서', icon: FileTextIcon }, { label: document.title, href: '/documents/spec' }, { label: '수정' }]} isFullScreen onBack={cancel}
      actions={isMobile ? undefined : (
        <div className="flex shrink-0 items-center gap-2">
          {layout && mode === 'pages' ? <span className="text-xs text-muted-foreground tabular-nums">{layout.count}페이지</span> : null}
          {status}
          {saveButton}
          <Button variant="ghost" onClick={cancel}>취소</Button>
          {doneButton}
        </div>
      )}>
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <DocumentEditor value={document.body} onChange={setBody} mode={mode} setup={setup} onSetupChange={setSetup} look={look} onLayout={setLayout}
          placeholder="내용을 입력하세요. / 로 블록을 넣습니다."
          toolbarEnd={isMobile ? undefined : <>{mode === 'pages' ? <PageLookMenu value={look} onChange={setLook} /> : null}<ModeSwitch mode={mode} onChange={setMode} /></>}
          above={<input aria-label="제목" placeholder="제목" autoComplete="off" value={title} onChange={event => setTitle(event.target.value)}
            className="box-border w-full bg-transparent py-2 text-[1.75rem] font-semibold outline-none placeholder:text-muted-foreground/70" />} />
        {isMobile && (
          <footer className="flex shrink-0 items-center gap-2 border-t px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <span className="mr-auto">{status}</span>
            {saveButton}
            {doneButton}
          </footer>
        )}
      </div>
      {/* 나가기 확인: 머무는 단추를 "계속 작성"으로 불러 무엇이 남는지 드러낸다. */}
      <ConfirmDialog open={isLeaveAsked} onOpenChange={setLeaveAsked} title="저장하지 않은 내용이 있습니다"
        description="지금 나가면 저장하지 않은 내용이 사라집니다. 남기려면 계속 작성을 눌러 저장하세요." cancelLabel="계속 작성"
        action={{ label: '버리고 나가기', onAction: () => { setLeaveAsked(false); leave(); } }} />
    </Page>
  );
}
