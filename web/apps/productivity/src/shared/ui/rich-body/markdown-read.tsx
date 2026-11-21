import { useQueries, useQuery } from '@tanstack/react-query';
import { Suspense, useMemo } from 'react';
import { Button } from '@/shared/ui/kit/button';
import { LazyRichBody as RichBody } from './LazyRichBody';
import type { RichBodySnapshot, RichBodyStore } from './use-rich-body';
import { readMarkdownDraft, readOfficeNoteDraft, type FileLink } from './markdown-draft';
import { Spinner } from '@/shared/ui/kit/spinner';

const ATTACHMENT = /attachment:([0-9a-fA-F-]{36})/g;
const frozen = (snapshot: RichBodySnapshot): RichBodyStore => ({
  initialSnapshot: snapshot, load: async () => snapshot, save: () => Promise.reject(new Error('이 본문은 여기서 고치지 않습니다.')),
});

/**
 * A body kept as Markdown (a notice's content, minutes, a report's part, an event's text, a project's description), read in
 * the same editor every body reads in (RichBody, read only): the server turns the Markdown into the editor's document, and
 * the files it names (attachment:<id>) open from the addresses linkOf gives.
 */
export function MarkdownRead({ value, linkOf, format, label }: { value: string; linkOf?: FileLink; format?: 'office-note'; label: string }) {
  const ids = useMemo(() => [...new Set([...value.matchAll(ATTACHMENT)].map(match => match[1]!))], [value]);
  const links = useQueries({ queries: ids.map(id => ({
    ...(linkOf?.(id) ?? { queryKey: ['unresolved-body-file', id], queryFn: async () => ({ url: '' }) }), enabled: !!linkOf,
  })) });
  const body = useQuery({
    queryKey: ['markdown-read', format ?? 'markdown', value],
    queryFn: async () => (await (format ? readOfficeNoteDraft(value) : readMarkdownDraft(value))) ?? null,
    staleTime: Infinity,
  });
  const isLinking = !!linkOf && links.some(link => link.isPending && link.fetchStatus !== 'idle');
  const files = Object.fromEntries(ids.flatMap((id, index) => (links[index]?.data?.url ? [[id, links[index]!.data!.url] as const] : [])));
  const filesKey = JSON.stringify(files);
  // The files are rebuilt each render; the store changes only when an address does.
  const store = useMemo(() => (body.data === undefined ? undefined
    : frozen({ version: 0, body: body.data, files: JSON.parse(filesKey) as Record<string, string> })), [body.data, filesKey]);
  if (body.isError) return <div role="alert" className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
    본문을 열지 못했습니다. {body.error.message}
    <Button variant="secondary" size="sm" onClick={() => void body.refetch()}>다시 시도</Button>
  </div>;
  const waiting = <Spinner role="status" aria-label={`${label}을 불러오는 중`} className="text-muted-foreground" />;
  if (!store || isLinking) return waiting;
  return <Suspense fallback={waiting}><RichBody key={filesKey} store={store} canEdit={false} title={label} /></Suspense>;
}
