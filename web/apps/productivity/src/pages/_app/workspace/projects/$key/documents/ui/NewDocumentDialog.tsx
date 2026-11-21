import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useCreateBoxDocument, type DocumentLabel } from '@/entities/document';
import type { JSONNode } from '@/shared/lib/rich-document';
import { ComposeSurface } from '@/shared/ui/kit/compose';
import { TagIcon } from '@/shared/ui/kit/icon';
import { MarkPicker } from '@/shared/ui/mark-picker';
import { PropertyPill } from '@/shared/ui/kit/property-pill';
import { RichDraft, useDraftFiles } from '@/shared/ui/rich-body';
import { LabelChoices } from './LabelChoices';

/**
 * 새 문서 · 새 하위 페이지: 표식(아이콘 · 색)과 제목, 블록 본문(첨부 포함)을 쓰고, 맨 위 문서만 라벨을 알약으로 고른다.
 * 제목은 키트 ComposeFields와 같은 모양이고, 본문은 블록 편집기(RichDraft)다.
 */
export function NewDocumentDialog({ projectKey, parentId, labels, canManageLabels = false, onDone, onClose }: {
  projectKey: string; parentId?: string; labels: DocumentLabel[]; canManageLabels?: boolean; onDone: (id: string) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState<JSONNode>();
  const files = useDraftFiles();
  const [isUploading, setUploadPending] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  // 문서·하위 페이지의 표식(아이콘·색): 제목 옆에서 고르고, 고르지 않으면 문서 아이콘이다.
  const [mark, setMark] = useState<{ icon: string | null; color: string | null }>({ icon: 'document', color: null });
  const create = useCreateBoxDocument();
  const save = useMutation({
    mutationFn: () => {
      if (isUploading) throw new Error('첨부 파일 업로드를 마치거나 취소한 뒤 저장해 주세요.');
      const prepared = body ? files.prepare(body) : undefined;
      return create.mutateAsync({ projectKey, parentId, kind: 'PAGE', title, mark: { icon: mark.icon ?? 'document', color: mark.color }, body: prepared?.body, uploadIds: prepared?.uploadIds, labelIds: chosen });
    }, onSuccess: onDone,
  });
  const name = parentId ? '새 하위 페이지' : '새 문서';
  return <ComposeSurface surface="dialog" crumbs={[{ label: name }]} onClose={onClose} error={save.error?.message}
    submit={{ label: '만들기', isDisabled: !title.trim() || isUploading, isPending: save.isPending, onSubmit: () => save.mutate() }}
    pills={!parentId ? <PropertyPill label="문서 라벨" icon={<TagIcon />} text={chosen.length ? `라벨 ${chosen.length}` : undefined} width="w-72">
      {() => <LabelChoices labels={labels} value={chosen} onChange={setChosen} canCreate={canManageLabels} />}
    </PropertyPill> : undefined}>
    <div className="flex min-w-0 items-center gap-2">
      <MarkPicker label={parentId ? '하위 페이지 표식' : '문서 표식'} value={{ icon: mark.icon ?? 'document', color: mark.color }}
        onChange={next => setMark({ icon: next.icon, color: next.color })} />
      <input aria-label="제목" placeholder="문서 제목" autoFocus autoComplete="off" value={title} onChange={event => setTitle(event.target.value.slice(0, 200))}
        className="min-w-0 flex-1 bg-transparent text-lg leading-snug font-semibold outline-none placeholder:text-muted-foreground/70 group-data-page/compose:text-2xl" />
    </div>
    <div className="min-h-14 group-data-page/compose:min-h-48">
      <RichDraft id={`new-project-document-${parentId ?? 'root'}`} label="본문" value={body} onChange={setBody} upload={files.upload}
        onUploadPendingChange={setUploadPending} placeholder="내용을 적어 주세요. / 로 블록 추가" />
    </div>
  </ComposeSurface>;
}
