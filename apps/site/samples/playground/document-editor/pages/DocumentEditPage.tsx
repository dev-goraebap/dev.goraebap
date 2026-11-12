import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { AlertDialog } from '@/shared/ui/composites/dialog/AlertDialog';
import { DocumentEditor } from '@/shared/ui/composites/document/DocumentEditor';
import type { DocumentMode } from '@/shared/ui/composites/document/model';
import { PageLookMenu } from '@/shared/ui/composites/document/PageLookMenu';
import type { PageLayout } from '@/shared/ui/composites/document/pagination';
import { useIsPhone } from '@/shared/ui/foundations/media';
import { Page } from '@/shared/ui/layouts/page/Page';
import { PageActions } from '@/shared/ui/layouts/page/PageParts';
import type { JSONContent } from '@tiptap/react';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useDocumentValue, usePageLook, useSaveDocumentValue } from '../app/store';
import { ModeSwitch } from './DocumentReadPage';
import styles from './document-editor.module.css';

/**
 * 문서 수정: 대화상자 없이 전체 페이지에서 쓴다. 위에 서식 막대(왼쪽 확대/축소, 오른쪽 문서 설정 · 페이지 모양 · 페이지 / 페이지 없음), 아래에 제목 칸과 본문.
 * 페이지 모드는 종이 위에 쓰며 페이지 끝을 넘는 것은 다음 페이지로 넘어간다. 용지·여백·머리말·바닥글은 문서 설정 칸에서 바꾼다.
 * 머리 줄은 본문 수정 화면(BodyEditPage)과 같다: 저장 상태, 저장(Ctrl/⌘+S, 제자리), 취소(고친 것이 있으면 먼저 묻는다), 완료(저장하고 돌아간다).
 * 휴대폰은 바닥 줄에 저장 · 완료, ←가 취소다.
 */
export function DocumentEditPage() {
  const document = useDocumentValue();
  const save = useSaveDocumentValue();
  const navigate = useNavigate();
  const isPhone = useIsPhone();
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
  const saveButton = <Button label="저장" variant="secondary" size={isPhone ? undefined : 'sm'} tooltip="Ctrl+S" isDisabled={!isDirty} onClick={store} />;
  const doneButton = <Button label="완료" variant="primary" size={isPhone ? undefined : 'sm'} tooltip="저장하고 돌아가기" onClick={done} />;
  return <Page crumbs={[{ label: '문서' }, { label: document.title, href: '/documents/spec' }, { label: '수정' }]} isDetail hasHeading={false} onBack={cancel}
    pageActions={isPhone ? undefined : <>
      {layout && mode === 'pages' ? <Text type="supporting" color="secondary" hasTabularNumbers>{layout.count}페이지</Text> : null}
      <Text type="supporting" color="secondary" role="status">{isDirty ? '저장 안 됨' : '저장됨'}</Text>
      {saveButton}
      <Button label="취소" variant="ghost" size="sm" onClick={cancel} />
      {doneButton}
    </>}>
    <DocumentEditor value={document.body} onChange={setBody} mode={mode} setup={setup} onSetupChange={setSetup} look={look} onLayout={setLayout} placeholder="내용을 입력하세요. / 로 블록을 넣습니다."
      toolbarEnd={isPhone ? undefined : <>{mode === 'pages' ? <PageLookMenu value={look} onChange={setLook} /> : null}<ModeSwitch mode={mode} onChange={setMode} /></>}
      above={<input className={styles.titleInput} value={title} aria-label="제목" placeholder="제목" onChange={event => setTitle(event.target.value)} />} />
    {isPhone ? <PageActions>{saveButton}{doneButton}</PageActions> : null}
    <AlertDialog isOpen={isLeaveAsked} onOpenChange={setLeaveAsked} title="저장하지 않은 내용이 있습니다"
      description="지금 나가면 저장하지 않은 내용이 사라집니다. 남기려면 계속 작성을 눌러 저장하세요."
      actionLabel="버리고 나가기" cancelLabel="계속 작성" onAction={() => { setLeaveAsked(false); leave(); }} />
  </Page>;
}
