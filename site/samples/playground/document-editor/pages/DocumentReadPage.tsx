import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import type { DocumentMode } from '@/shared/ui/composites/document/model';
import { DocumentView, scrollToPage } from '@/shared/ui/composites/document/DocumentView';
import { ExportMenu } from '@/shared/ui/composites/document/ExportMenu';
import { PageLookMenu } from '@/shared/ui/composites/document/PageLookMenu';
import { PagesPill } from '@/shared/ui/composites/document/PagesPill';
import type { PageLayout } from '@/shared/ui/composites/document/pagination';
import { PropertyPill } from '@/shared/ui/composites/property/PropertyPill';
import { useIsPhone } from '@/shared/ui/foundations/media';
import { DetailLayout } from '@/shared/ui/layouts/detail/DetailLayout';
import { Page } from '@/shared/ui/layouts/page/Page';
import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { useDocumentValue, usePageLook } from '../app/store';

/**
 * 문서 읽기: 다른 상세와 같은 배치(DetailLayout)다. 본문 열에 문서를 페이지(페이지마다 나눠) 또는 페이지 없음으로 읽고,
 * 오른쪽 정보 칸에 작성 정보와 페이지 항목(누르면 페이지 목록, 고르면 그 페이지로)을 둔다. 휴대폰은 늘 페이지 없음이다.
 * 머리 줄에 페이지 모양 · 보기 전환 · 내보내기(PDF로 저장 · 인쇄 · 링크 복사) · 편집.
 */
export function DocumentReadPage() {
  const document = useDocumentValue();
  const navigate = useNavigate();
  const isPhone = useIsPhone();
  const [mode, setMode] = useState<DocumentMode>('pages');
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const [look, setLook] = usePageLook();
  const isPaged = !isPhone && mode === 'pages';
  return <Page crumbs={[{ label: '문서' }, { label: document.title }]} isDetail hasHeading={false}
    pageActions={<>
      {isPaged ? <PageLookMenu value={look} onChange={setLook} /> : null}
      {isPhone ? null : <ModeSwitch mode={mode} onChange={setMode} />}
      <ExportMenu />
      <Button label="편집" variant="secondary" size="sm" onClick={() => void navigate({ href: '/documents/spec/edit' })} />
    </>}>
    <DetailLayout label={document.title} title={<Heading level={1}>{document.title}</Heading>}
      sections={[{ title: '정보', items: <>
        <PropertyPill label="작성자" icon={null} isEmpty={false} isDisabled text="김하늘" />
        <PropertyPill label="용지" icon={null} isEmpty={false} isDisabled text={`${document.setup.paper} ${document.setup.orientation === 'portrait' ? '세로' : '가로'}`} />
        {isPaged ? <PagesPill layout={layout} onSelect={number => scrollToPage(root, number)} /> : null}
      </> }]}>
      <DocumentView value={document.body} mode={mode} setup={document.setup} look={look} isInline onLayout={setLayout} rootRef={root} />
    </DetailLayout>
  </Page>;
}

/** 페이지 / 페이지 없음 전환. 읽기와 편집이 같은 것을 쓴다. */
export function ModeSwitch({ mode, onChange }: { mode: DocumentMode; onChange: (mode: DocumentMode) => void }) {
  return <SegmentedControl label="보기" size="sm" value={mode} onChange={value => onChange(value as DocumentMode)}>
    <SegmentedControlItem value="pages" label="페이지" />
    <SegmentedControlItem value="pageless" label="페이지 없음" />
  </SegmentedControl>;
}
