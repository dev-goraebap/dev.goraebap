import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { ApiError } from '@/shared/api';
import type { JSONNode } from '@/shared/lib/rich-document';
import type { PageSetup } from '@/shared/ui/paged-document';
import type { RichBodySnapshot, RichBodyStore } from '@/shared/ui/rich-body';

/** 미리보기가 그리는 문서 하나의 본문 조회 키(인쇄 화면과 같은 것). */
export const printBodyKey = (id: string) => ['documents', 'print-body', id] as const;

type Target = { pageId: string; blockId: string; isBreak: boolean; place: { insetBlockStart: string; insetInlineStart: string } };
/** 페이지 설정을 고친 뒤 이만큼 멈추면 저장하고 다시 나눈다(ms). */
const SETUP_PAUSE = 600;

const blockIdsOf = (body: JSONNode | null) => (body?.content ?? []).flatMap(node => typeof node.attrs?.blockId === 'string' ? [node.attrs.blockId] : []);

/**
 * PDF 미리보기에서 쪽을 손보는 일(2026-11-11 사용자 결정: 상세·수정은 쪽으로 나누지 않고, 쪽은 문서 전체를 보면서 미리보기에서
 * 정한다). 쓸 수 있는 사람이 블록에 마우스를 올리면 '여기부터 다음 쪽으로'(그 블록의 printBreakBefore)를 켜고 끄며, 누를 때마다 그
 * 블록 하나만 바로 저장한다(버전으로 남기지 않는다). 페이지 설정(용지·여백·머리말·바닥글)은 맨 위 문서의 본문 루트에 저장하고,
 * 고치기를 멈추면 저장한다. 저장한 본문은 미리보기의 조회 값을 바꿔 그 문서를 다시 나눈다.
 */
export function useAdjustments({ canWrite, entries, bodies, stores, root }: {
  canWrite: boolean; entries: { page: { id: string } }[]; bodies: (RichBodySnapshot | undefined)[];
  stores: Map<string, RichBodyStore>; root: RefObject<HTMLDivElement | null>;
}) {
  const client = useQueryClient();
  const [target, setTarget] = useState<Target | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [draftSetup, setDraftSetup] = useState<PageSetup | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const bodyOf = (pageId: string) => bodies[entries.findIndex(entry => entry.page.id === pageId)];

  /** 저장 실패: 그사이 다른 곳에서 바뀌었으면 최신 본문을 다시 읽고 알린다. */
  const fail = async (pageId: string, error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      setNotice('다른 곳에서 본문이 바뀌어 최신 내용을 다시 읽었습니다. 다시 눌러 주세요.');
      await client.invalidateQueries({ queryKey: printBodyKey(pageId) });
    } else setNotice(error instanceof Error ? error.message : '저장하지 못했습니다.');
  };

  /** 마우스 아래의 맨 바깥 블록(문서 제목과 본문 첫 블록은 빼고: 문서는 늘 새 쪽에서 시작한다). */
  const hover = (event: PointerEvent<HTMLElement>) => {
    // 맨 바깥 블록: 본문(.ProseMirror)의 바로 아래 자식. 표처럼 감싼 상자가 있으면 그 안의 블록 id를 읽는다.
    let element = (event.target as HTMLElement).closest<HTMLElement>('.ProseMirror > *');
    while (element && !element.parentElement?.classList.contains('ProseMirror')) element = element.parentElement?.closest<HTMLElement>('.ProseMirror > *') ?? null;
    const section = element?.closest<HTMLElement>('[data-print-doc]');
    const box = root.current;
    if (!element || !section || !box || isSaving) return;
    const idOf = (each: Element) => (each as HTMLElement).dataset.blockId ?? each.querySelector<HTMLElement>(':scope > [data-block-id]')?.dataset.blockId;
    const blockId = idOf(element);
    const blocks = [...element.parentElement!.children].filter(idOf);
    if (!blockId || blocks.indexOf(element) < 2) { setTarget(null); return; }
    if (target?.blockId === blockId) return;
    const pageId = section.dataset.printDoc!;
    const node = bodyOf(pageId)?.body?.content?.find(each => each.attrs?.blockId === blockId);
    if (!node) { setTarget(null); return; }
    const rect = element.getBoundingClientRect(), frame = box.getBoundingClientRect();
    setTarget({ pageId, blockId, isBreak: node.attrs?.printBreakBefore === true,
      place: { insetBlockStart: `${rect.top - frame.top}px`, insetInlineStart: `${rect.left - frame.left}px` } });
  };

  /** 고른 블록의 '새 쪽에서 시작'을 켜거나 끄고 그 블록만 저장한다. */
  const toggle = async () => {
    if (!target) return;
    const { pageId, blockId } = target;
    const snapshot = bodyOf(pageId), store = stores.get(pageId);
    const node = snapshot?.body?.content?.find(each => each.attrs?.blockId === blockId);
    if (!snapshot?.body || !node || !store?.patch) return;
    const next = { ...node, attrs: { ...node.attrs, printBreakBefore: node.attrs?.printBreakBefore === true ? null : true } };
    setSaving(true); setNotice('');
    try {
      const saved = await store.patch({ order: blockIdsOf(snapshot.body), puts: [{ blockId, node: next, expectedVersion: snapshot.blocks?.[blockId] ?? null }],
        deletes: [], attrs: null, uploadIds: [], checkpoint: false });
      client.setQueryData(printBodyKey(pageId), saved);
      setTarget(null);
    } catch (error) {
      await fail(pageId, error);
    } finally {
      setSaving(false);
    }
  };

  /** 페이지 설정: 칸에는 바로 보이고, 고치기를 멈추면 맨 위 문서에 저장해 다시 나눈다. */
  const changeSetup = (setup: PageSetup) => {
    setDraftSetup(setup);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void saveSetup(setup), SETUP_PAUSE);
  };
  const saveSetup = async (setup: PageSetup) => {
    const rootId = entries[0]?.page.id, snapshot = bodies[0], store = rootId ? stores.get(rootId) : undefined;
    if (!rootId || !store?.patch) return;
    setSaving(true); setNotice('');
    try {
      const saved = await store.patch({ order: blockIdsOf(snapshot?.body ?? null), puts: [], deletes: [],
        attrs: { ...snapshot?.body?.attrs, pageSetup: setup }, uploadIds: [], checkpoint: false });
      client.setQueryData(printBodyKey(rootId), saved);
      setDraftSetup(null);
    } catch (error) {
      await fail(rootId, error);
    } finally {
      setSaving(false);
    }
  };

  return { canAdjust: canWrite, target, isSaving, notice, hover, toggle, draftSetup, changeSetup, leave: () => setTarget(null) };
}
