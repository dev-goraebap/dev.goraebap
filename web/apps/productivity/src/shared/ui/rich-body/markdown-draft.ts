import { useQueries, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { sendJson, type components } from '@/shared/api';
import type { JSONNode } from '@/shared/lib/rich-document';
import { mapBodySources } from './body-sources';
import { useDraftFiles, type DraftFilesSnapshot } from './use-draft-files';

/** 파일 하나의 받을 주소를 묻는 쿼리(주인의 파일 API). download면 내려받기 주소다. */
export type FileLink = (fileId: string, download?: boolean) => UseQueryOptions<{ url: string }, Error, { url: string }, readonly unknown[]>;

export async function readMarkdownDraft(markdown: string): Promise<JSONNode | undefined> {
  if (!markdown.trim()) return undefined;
  const result = await sendJson<components['schemas']['RichDraft']>('/api/v1/workspace/body-conversions/rich', 'POST', { markdown });
  if (result.body.type !== 'doc') throw new Error('편집할 본문을 열지 못했습니다.');
  return result.body as JSONNode;
}

export async function writeMarkdownDraft(body: JSONNode | undefined, original: string, max: number, label: string) {
  const markdown = body
    ? (await sendJson<components['schemas']['MarkdownDraft']>('/api/v1/workspace/body-conversions/markdown', 'POST', { body })).markdown
    : original;
  if (markdown.length > max) throw new Error(`${label}은(는) ${max.toLocaleString()}자까지 적을 수 있습니다.`);
  return markdown;
}

// Older office notes are plain text. Mark new notes so existing punctuation and line breaks keep their meaning.
const NOTE_MARKER = '<!-- cowork:markdown -->\n\n';
export const officeNoteMarkdown = (value: string) => value.startsWith(NOTE_MARKER) ? value.slice(NOTE_MARKER.length) : undefined;

export function readOfficeNoteDraft(value: string): Promise<JSONNode | undefined> {
  const markdown = officeNoteMarkdown(value);
  if (markdown !== undefined) return readMarkdownDraft(markdown);
  return Promise.resolve(value.trim() ? {
    type: 'doc',
    content: value.split(/\r?\n/).map(line => ({ type: 'paragraph', content: line ? [{ type: 'text', text: line }] : [] })),
  } : undefined);
}

export async function writeOfficeNoteDraft(body: JSONNode | undefined, original: string, max: number, label: string) {
  if (!body) return original;
  const markdown = await writeMarkdownDraft(body, '', max, label);
  const stored = markdown ? NOTE_MARKER + markdown : '';
  if (stored.length > max) throw new Error(`${label}은(는) ${(max - NOTE_MARKER.length).toLocaleString()}자까지 적을 수 있습니다.`);
  return stored;
}

export type MarkdownDraftSnapshot = {
  value?: JSONNode;
  files: DraftFilesSnapshot;
  storedSources: readonly (readonly [string, string])[];
};

/** Keep the stored Markdown byte-for-byte until the user actually edits the body. */
export function useMarkdownDraft(original: string, format?: 'office-note', linkOf?: FileLink, initialSnapshot?: MarkdownDraftSnapshot) {
  const [value, setValue] = useState<JSONNode | undefined>(initialSnapshot?.value);
  const [isUploading, setUploadPending] = useState(false);
  const files = useDraftFiles(initialSnapshot?.files);
  const fileIds = [...new Set([...original.matchAll(/attachment:([0-9a-fA-F-]{36})/g)].map(match => match[1]!))];
  const links = useQueries({ queries: fileIds.map(id => ({
    ...(linkOf?.(id) ?? { queryKey: ['unresolved-draft-file', id], queryFn: async () => ({ url: '' }) }),
    enabled: !!linkOf,
  })) });
  const shownSources = new Map(fileIds.flatMap((id, index) => links[index]?.data?.url ? [[`attachment:${id}`, links[index]!.data!.url] as const] : []));
  // A draft may still contain a signed preview URL fetched before a background refresh.
  const storedSources = useRef(new Map<string, string>(initialSnapshot?.storedSources));
  for (const [reference, url] of shownSources) storedSources.current.set(url, reference);
  const initial = useQuery({
    queryKey: ['markdown-draft', format, original],
    queryFn: async () => (await (format ? readOfficeNoteDraft(original) : readMarkdownDraft(original))) ?? null,
    enabled: !!original.trim(),
    staleTime: Infinity,
  });
  const shown = value ?? (initial.data ? mapBodySources(initial.data, shownSources) : undefined);
  // 편집기는 읽어 온 본문을 처음 그리며 값을 몇 번 내보낸다(정규화 · 그림 주소). 처음 내보낸 뒤 0.5초 안의 값은 기준으로 삼고,
  // 그 뒤에 사람이 고친 것만 '바뀜'으로 친다.
  const loaded = useRef<{ json: string; at: number } | undefined>(undefined);
  const change = (next: JSONNode) => {
    const now = performance.now();
    const settling = loaded.current ? now - loaded.current.at < 500 : value === undefined && !!original.trim() && !!initial.data;
    if (settling) loaded.current = { json: JSON.stringify(next), at: loaded.current?.at ?? now };
    setValue(next);
  };
  const prepare = () => shown ? files.prepare(mapBodySources(shown, storedSources.current)) : undefined;
  return {
    value: shown,
    handoff: (): MarkdownDraftSnapshot => ({ value, files: files.handoff(), storedSources: [...storedSources.current] }),
    setValue: change,
    /** 쓴 사람이 본문을 고쳤다(처음 그릴 때의 정규화는 치지 않는다). */
    isChanged: value !== undefined && JSON.stringify(value) !== loaded.current?.json,
    reset: () => { setValue(undefined); loaded.current = undefined; files.reset(); storedSources.current.clear(); setUploadPending(false); },
    isPending: (!!original.trim() && initial.isPending) || (!!linkOf && links.some(link => link.isPending && link.fetchStatus !== 'idle')),
    upload: files.upload,
    uploadIds: prepare()?.uploadIds ?? [],
    isUploading,
    setUploadPending,
    error: initial.error,
    retry: () => { void initial.refetch(); },
    write: (max: number, label: string) => {
      if (isUploading) return Promise.reject(new Error('첨부 파일 업로드를 마치거나 취소한 뒤 저장해 주세요.'));
      return (format ? writeOfficeNoteDraft : writeMarkdownDraft)(value ? prepare()?.body : undefined, original, max, label);
    },
  };
}
