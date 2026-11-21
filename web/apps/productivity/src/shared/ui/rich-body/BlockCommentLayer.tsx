import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import {
  BLOCK_THREAD_EVENT, blockBoxStyle, blockElementId, blockMarkRules, topBlockAt, topBlocks,
  type BlockBox, type BlockComments, type BlockThread,
} from './block-comments';
import { BlockThreadCard } from './BlockThreadCard';

/**
 * 본문 위의 블록 댓글 층. 댓글 모드(isCommenting)에서는 포인터 아래 블록에 박스를 씌우고, 누르면 그 블록의 스레드 창(없으면 새 댓글)을
 * 연다. 열린 스레드가 있는 블록은 Tiptap처럼 글을 조금 옅게 하고 노란 점선 밑줄을 긋는다. 올리면 진해지고, 누르면 스레드를 연다.
 * 해결한 스레드는 표시하지 않는다(활동 기록에는 남는다).
 */
export function BlockCommentLayer({ box, comments, isCommenting, onCommenting }: {
  box: RefObject<HTMLElement | null>; comments: BlockComments; isCommenting: boolean; onCommenting: (on: boolean) => void;
}) {
  const [layout, setLayout] = useState<Map<string, BlockBox>>(new Map());
  const [hover, setHover] = useState<BlockBox | null>(null);
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const measure = useCallback(() => {
    const element = box.current;
    if (!element) return;
    const frame = element.getBoundingClientRect(), next = new Map<string, BlockBox>();
    topBlocks(element).forEach((block, id) => {
      const rect = block.getBoundingClientRect();
      next.set(id, { top: rect.top - frame.top, left: rect.left - frame.left, width: rect.width, height: rect.height });
    });
    setLayout(next);
  }, [box]);
  // 본문이 그려지거나 크기가 바뀌면 블록 자리를 다시 잰다(한 프레임에 한 번).
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return undefined;
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure(); }); };
    const resize = new ResizeObserver(schedule), mutation = new MutationObserver(schedule);
    resize.observe(element);
    mutation.observe(element, { childList: true, subtree: true, characterData: true });
    schedule();
    return () => { resize.disconnect(); mutation.disconnect(); cancelAnimationFrame(frame); };
  }, [box, measure]);
  useEffect(() => { measure(); }, [comments.threads, measure]);
  // 열 때 그 자리를 다시 잰다: 처음 들어와 도표·사진이 늦게 그려지면 앞서 잰 자리가 어긋나 있다.
  const openAt = useCallback((blockId: string) => { measure(); setOpenBlock(blockId); }, [measure]);
  // 활동 기록에서 블록 댓글을 누르면 그 블록으로 가서 연다.
  useEffect(() => {
    const open = (event: Event) => {
      const blockId = (event as CustomEvent<string>).detail;
      const element = box.current && topBlocks(box.current).get(blockId);
      element?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      openAt(blockId);
    };
    window.addEventListener(BLOCK_THREAD_EVENT, open);
    return () => window.removeEventListener(BLOCK_THREAD_EVENT, open);
  }, [box, openAt]);
  const commented = useRef(new Set<string>());
  // 댓글 모드: Esc로 끈다.
  useEffect(() => {
    if (!isCommenting) { setHover(null); return undefined; }
    const keys = (event: KeyboardEvent) => { if (event.key === 'Escape') onCommenting(false); };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, [isCommenting, onCommenting]);
  // 댓글이 달린 블록을 누르면(링크·단추·글 고르기는 빼고) 그 스레드를 연다.
  useEffect(() => {
    const element = box.current;
    if (!element || isCommenting) return undefined;
    const click = (event: MouseEvent) => {
      if ((event.target as Element).closest('a, button, input, textarea, [contenteditable="true"] *') || window.getSelection()?.toString()) return;
      const block = topBlockAt(event.target), id = block && blockElementId(block);
      if (!id || !commented.current.has(id)) return;
      openAt(id);
    };
    element.addEventListener('click', click);
    return () => element.removeEventListener('click', click);
  }, [box, isCommenting, openAt]);
  useEffect(() => {
    const element = box.current;
    if (!element) return undefined;
    element.dataset.commenting = isCommenting ? 'true' : 'false';
    if (!isCommenting) return undefined;
    const frameOf = () => element.getBoundingClientRect();
    const move = (event: globalThis.PointerEvent) => {
      const block = topBlockAt(event.target);
      if (!block || !blockElementId(block)) { setHover(null); return; }
      const rect = block.getBoundingClientRect(), frame = frameOf();
      setHover({ top: rect.top - frame.top, left: rect.left - frame.left, width: rect.width, height: rect.height });
    };
    const click = (event: MouseEvent) => {
      const block = topBlockAt(event.target), id = block && blockElementId(block);
      if (!id) return;
      event.preventDefault();
      event.stopPropagation();
      onCommenting(false);
      openAt(id);
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('click', click, true);
    return () => { element.removeEventListener('pointermove', move); element.removeEventListener('click', click, true); delete element.dataset.commenting; };
  }, [box, isCommenting, onCommenting, openAt]);

  const open = comments.threads.filter(thread => !thread.resolvedAt);
  const byBlock = new Map<string, BlockThread>();
  open.forEach(thread => { if (!byBlock.has(thread.blockId)) byBlock.set(thread.blockId, thread); });
  commented.current = new Set(byBlock.keys());
  const scope = useId().replace(/:/g, '');
  useEffect(() => { if (box.current) box.current.dataset.commentScope = scope; }, [box, scope]);
  // 열린 창은 그 블록을 따라간다: 도표·사진이 늦게 그려져 블록이 밀리면(처음 들어왔을 때) 창도 함께 옮긴다.
  const [follow, setFollow] = useState<BlockBox | null>(null);
  useEffect(() => {
    if (!openBlock) { setFollow(null); return undefined; }
    let frame = 0;
    const track = () => {
      const element = box.current, block = element && topBlocks(element).get(openBlock);
      if (element && block) {
        const rect = block.getBoundingClientRect(), outer = element.getBoundingClientRect();
        const next = { top: rect.top - outer.top, left: rect.left - outer.left, width: rect.width, height: rect.height };
        setFollow(now => now && now.top === next.top && now.left === next.left && now.width === next.width && now.height === next.height ? now : next);
      }
      frame = requestAnimationFrame(track);
    };
    track();
    return () => cancelAnimationFrame(frame);
  }, [box, openBlock]);
  const openBox = openBlock ? follow ?? layout.get(openBlock) : undefined;
  const quoteOf = (blockId: string) => {
    const element = box.current && topBlocks(box.current).get(blockId);
    return (element?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  };
  return <>
    {byBlock.size ? <style>{blockMarkRules(scope, [...byBlock.keys()], openBlock)}</style> : null}
    {/* 댓글 모드에서 포인터 아래 블록에 씌우는 박스: 블록보다 조금 넓게, 옅은 바탕과 강조색 테두리. */}
    {/* check-ui: allow-style 블록마다 잰 자리와 크기다. */}
    {isCommenting && hover ? <div className="pointer-events-none absolute z-1 box-border rounded-[0.625rem] bg-primary/5 outline-[1.5px] outline-offset-[5px] outline-primary/45 outline-solid" style={blockBoxStyle(hover)} aria-hidden /> : null}
    {openBlock && openBox ? <BlockThreadCard key={openBlock} place={openBox} thread={byBlock.get(openBlock)} comments={comments}
      onClose={() => setOpenBlock(null)}
      onCreate={body => comments.create(openBlock, quoteOf(openBlock), body)} /> : null}
  </>;
}
