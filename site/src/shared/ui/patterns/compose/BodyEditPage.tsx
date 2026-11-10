import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { JSONContent } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { AlertDialog } from '../../composites/dialog/AlertDialog';
import { RichDraft } from '../../composites/editor/RichDraft';
import type { LinkChoice, ReadLinkPreview, UploadFile } from '../../composites/editor/types';
import { useIsPhone } from '../../foundations/media';
import { Page } from '../../layouts/page/Page';
import type { Crumb } from '../../layouts/page/PageHeader';
import { PageActions, PageBanner } from '../../layouts/page/PageParts';
import { ComposeForm } from './ComposeForm';

export type BodyEditValue = { title: string; body: JSONContent };

/**
 * 본문 수정 화면(…/edit). 상세의 편집 단추는 늘 이 화면을 연다. 제목(시스템 제목 하나)과 본문만 두고 속성·활동은 두지 않는다.
 * 머리 줄에 저장 상태와 저장 · 취소 · 완료(휴대폰은 바닥 줄에 저장 · 완료, ←가 취소). 저장과 Ctrl/⌘+S는 제자리에 남기고,
 * 완료는 저장한 뒤 상세로 돌아가며, 취소는 저장하지 않고 돌아가되 고친 것이 있으면 먼저 묻는다. 실패하면 쓴 내용을 그대로 두고 알린다.
 */
export function BodyEditPage({ crumbs, value, onSave, onLeave, titlePlaceholder = '제목', upload, readPreview, links }: {
  crumbs: Crumb[]; value: BodyEditValue; onSave: (value: BodyEditValue) => Promise<unknown>; onLeave: () => void; titlePlaceholder?: string;
  upload?: UploadFile; readPreview?: ReadLinkPreview; links?: LinkChoice[];
}) {
  const isPhone = useIsPhone();
  const [title, setTitle] = useState(value.title);
  const [body, setBody] = useState(value.body);
  const [saved, setSaved] = useState(() => JSON.stringify({ title: value.title.trim(), body: value.body }));
  const [isSaving, setSaving] = useState(false), [failure, setFailure] = useState(''), [isLeaveAsked, setLeaveAsked] = useState(false);
  const isDirty = JSON.stringify({ title: title.trim(), body }) !== saved;
  const save = async () => {
    if (!title.trim()) { setFailure('제목을 입력해 주세요.'); throw Error('제목 없음'); }
    setSaving(true); setFailure('');
    const next = { title: title.trim(), body };
    try { await onSave(next); setSaved(JSON.stringify(next)); }
    catch (error) { setFailure('저장하지 못했습니다. 작성 중인 내용은 이 화면에 그대로 있습니다.'); throw error; }
    finally { setSaving(false); }
  };
  const latest = useRef(save);
  latest.current = save;
  // Ctrl+S (⌘S)는 브라우저의 저장 대신 이 화면을 저장한다.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') { event.preventDefault(); void latest.current().catch(() => undefined); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const done = () => void save().then(onLeave, () => undefined);
  const cancel = () => { if (isDirty) setLeaveAsked(true); else onLeave(); };
  const status = isSaving ? '저장 중…' : isDirty ? '저장 안 됨' : '저장됨';
  const saveButton = <Button label="저장" variant="secondary" size={isPhone ? undefined : 'sm'} tooltip="Ctrl+S" isDisabled={!isDirty} isLoading={isSaving} onClick={() => void save().catch(() => undefined)} />;
  const doneButton = <Button label="완료" variant="primary" size={isPhone ? undefined : 'sm'} tooltip="저장하고 돌아가기" isDisabled={isSaving} onClick={done} />;
  return <Page crumbs={crumbs} isDetail hasHeading={false} hasPattern={false} onBack={cancel}
    pageActions={isPhone ? undefined : <>
      <Text type="supporting" color="secondary" role="status">{status}</Text>
      {saveButton}
      <Button label="취소" variant="ghost" size="sm" isDisabled={isSaving} onClick={cancel} />
      {doneButton}
    </>}>
    {failure ? <PageBanner status="error" title={failure} /> : null}
    {/* 작성 페이지와 같은 읽는 폭(45rem) 열. 좌우 여백이 블록 손잡이 자리를 품는다. */}
    <HStack hAlign="center" paddingInline={isPhone ? 4 : 10} paddingBlock={isPhone ? 5 : 8}>
      <VStack width="100%" maxWidth="45rem">
        <ComposeForm isPage title={title} onTitle={setTitle} titlePlaceholder={titlePlaceholder}
          body={<RichDraft value={value.body} onChange={setBody} isPage label="본문" placeholder="내용을 입력하세요. / 로 블록을 넣고, 글을 고르면 서식 도구가 뜹니다."
            upload={upload} readPreview={readPreview} links={links} />} />
      </VStack>
    </HStack>
    {isPhone ? <PageActions>{saveButton}{doneButton}</PageActions> : null}
    <AlertDialog isOpen={isLeaveAsked} onOpenChange={setLeaveAsked} title="저장하지 않은 내용이 있습니다"
      description="지금 나가면 저장하지 않은 내용이 사라집니다. 남기려면 계속 작성을 눌러 저장하세요."
      actionLabel="버리고 나가기" cancelLabel="계속 작성" onAction={() => { setLeaveAsked(false); onLeave(); }} />
  </Page>;
}
