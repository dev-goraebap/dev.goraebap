import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/button';
import { DocumentView, ExportMenu, PageLookMenu, PagesPill, scrollToPage, type DocumentMode, type PageLayout } from '@/shared/ui/document';
import { FileIcon, FileTextIcon, PencilIcon, UserIcon } from '@/shared/ui/icon';
import { InfoPill } from '@/shared/ui/info-pill';
import { Page } from '@/shared/ui/page';
import { DetailLayout } from '@/shared/ui/reading';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { useDocumentValue, usePageLook } from '../app/store';

/** 페이지 / 페이지 없음 전환. 읽기와 편집이 같은 것을 쓴다. */
export function ModeSwitch({ mode, onChange }: { mode: DocumentMode; onChange: (mode: DocumentMode) => void }) {
  return <SegmentedControl label="보기" value={mode} onChange={onChange} options={[{ value: 'pages', label: '페이지' }, { value: 'pageless', label: '페이지 없음' }]} />;
}

/**
 * 문서 읽기: 다른 상세와 같은 배치(DetailLayout)다. 본문 열에 문서를 페이지(페이지마다 나눠) 또는 페이지 없음으로 읽고,
 * 오른쪽 속성 칸에 작성 정보와 페이지 항목(누르면 페이지 목록, 고르면 그 페이지로)을 둔다. 휴대폰은 늘 페이지 없음이다.
 * 머리 줄에 페이지 모양 · 보기 전환 · 내보내기(PDF로 저장 · 인쇄 · 링크 복사) · 편집.
 */
export function DocumentReadPage() {
  const document = useDocumentValue();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<DocumentMode>('pages');
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const [look, setLook] = usePageLook();
  const isPaged = !isMobile && mode === 'pages';
  const edit = () => void navigate({ href: '/documents/spec/edit' });
  return (
    <Page crumbs={[{ label: '문서', icon: FileTextIcon }, { label: document.title }]} isFullScreen
      actions={
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {isPaged ? <PageLookMenu value={look} onChange={setLook} /> : null}
          {isMobile ? null : <ModeSwitch mode={mode} onChange={setMode} />}
          <ExportMenu />
          {isMobile
            ? <Button variant="ghost" size="icon" aria-label="편집" className="size-11" onClick={edit}><PencilIcon /></Button>
            : <Button variant="secondary" onClick={edit}><PencilIcon data-icon="inline-start" />편집</Button>}
        </div>
      }>
      <DetailLayout label={document.title} title={document.title}
        sections={[{ title: '정보', items: <>
          <InfoPill label="작성자" icon={<UserIcon />}>김하늘</InfoPill>
          <InfoPill label="용지" icon={<FileIcon />}>{`${document.setup.paper} ${document.setup.orientation === 'portrait' ? '세로' : '가로'}`}</InfoPill>
          {isPaged ? <PagesPill layout={layout} onSelect={number => scrollToPage(root, number)} /> : null}
        </> }]}>
        <DocumentView value={document.body} mode={mode} setup={document.setup} look={look} isInline onLayout={setLayout} rootRef={root} />
      </DetailLayout>
    </Page>
  );
}
