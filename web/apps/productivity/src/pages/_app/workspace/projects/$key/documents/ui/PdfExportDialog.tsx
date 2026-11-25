import { useId, useState } from 'react';
import { Field, FieldContent, FieldLabel } from '@goraebap/ui-react/components/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { SegmentedControl } from '@/shared/ui/kit/segmented-control';
import { Switch } from '@goraebap/ui-react/components/switch';

/** 고른 구성을 PDF 미리보기 주소의 쿼리로 만든다(1·0). */
export const pdfQuery = (choice: { cover: boolean; toc: boolean; headings: boolean }) =>
  `?cover=${Number(choice.cover)}&toc=${Number(choice.toc)}&headings=${Number(choice.headings)}`;

function SwitchField({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const id = useId();
  return <Field orientation="horizontal">
    <FieldContent>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
    </FieldContent>
    <Switch appearance="compact" id={id} checked={value} onCheckedChange={onChange} />
  </Field>;
}

/**
 * PDF 내보내기: 구성(표지·목차·목차 범위)을 고르면 새 창에 PDF 미리보기를 연다. 서버가 아니라 이 브라우저가 만든다: 미리보기에서
 * 쪽 나눔을 보며 새 쪽 시작과 페이지 설정을 고친 뒤 'PDF로 저장'을 누르고, 인쇄 창의 대상을 'PDF로 저장'으로 고르면 파일이 된다.
 * 기본값은 인쇄 화면과 같다(하위 문서가 있으면 표지와 문서 목차, 문서 하나면 둘 다 끔). 브라우저가 새 창을 막으면 이 창에 알린다.
 */
export function PdfExportDialog({ documentId, name, hasPages, onClose }: {
  documentId: string; name: string; hasPages: boolean; onClose: () => void;
}) {
  const [cover, setCover] = useState(hasPages);
  const [toc, setToc] = useState(hasPages);
  const [headings, setHeadings] = useState(!hasPages);
  const [isBlocked, setBlocked] = useState(false);
  const exportNow = () => {
    const opened = window.open(`/print/documents/${encodeURIComponent(documentId)}${pdfQuery({ cover, toc, headings: hasPages ? headings : true })}`, '_blank');
    if (!opened) { setBlocked(true); return; }
    onClose();
  };
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title="PDF로 내보내기" description={name}
    submitLabel="미리보기 열기" onSubmit={exportNow}>
    <SwitchField label="표지" value={cover} onChange={setCover} />
    <SwitchField label="목차" value={toc} onChange={setToc} />
    {hasPages && toc ? <div className="flex flex-col gap-1.5">
      <SegmentedControl label="목차 범위" className="w-full" value={headings ? 'headings' : 'documents'} onChange={value => setHeadings(value === 'headings')}
        options={[{ value: 'documents', label: '페이지만' }, { value: 'headings', label: '본문 소제목까지' }]} />
      <p className="text-xs text-muted-foreground">
        {headings ? '각 페이지 아래에 본문의 소제목(H2·H3)까지 넣습니다. 목차가 길어집니다.' : '이 문서와 하위 페이지의 제목만 넣습니다.'}
      </p>
    </div> : null}
    <p className="text-xs text-muted-foreground">
      새 창에 미리보기가 열립니다. 쪽 나눔을 확인하고 필요하면 블록을 다음 쪽으로 내리거나 페이지 설정을 고친 뒤 'PDF로 저장'을 누르세요.
    </p>
    {isBlocked ? <p role="alert" className="text-xs text-destructive">브라우저가 새 창을 막았습니다. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.</p> : null}
  </FormDialog>;
}
