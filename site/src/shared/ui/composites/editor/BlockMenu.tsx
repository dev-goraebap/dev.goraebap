import { VStack } from '@astryxdesign/core/VStack';
import { TextSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { ColorList, MenuDivider, MenuItem, MenuTitle, MOD, TEXT_BLOCKS, TurnIntoList, moveInMenu, turnInto, type TextBlockId } from './menus';
import styles from './editor.module.css';

const TYPE_LABELS: Record<string, string> = { paragraph: '텍스트', bulletList: '글머리 목록', orderedList: '번호 목록', taskList: '할 일 목록', blockquote: '인용',
  codeBlock: '코드', table: '표', media: '파일', mermaidBlock: '다이어그램', horizontalRule: '구분선', webEmbed: '링크 카드' };
/** 색을 입히거나 종류를 바꿀 수 있는 글 블록. 코드는 색을 입히지 않는다. */
const TEXTUAL = ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock'];

export type MenuBlock = { id: string; pos: number; size: number; type: string };

/** 그 블록의 주소: 지금 화면 주소에 블록 표시(#block-…)를 붙인다. 그 주소로 열면 그 블록으로 옮겨 간다(RichEditor). */
export const blockLink = (id: string) => `${window.location.origin}${window.location.pathname}${window.location.search}#block-${id}`;

/** 블록을 클립보드에 담는다: 붙여 넣을 때 서식이 살도록 HTML과 글을 함께. */
export async function copyBlocks(editor: Editor, ranges: { pos: number; size: number }[]) {
  if (!ranges.length) return;
  const from = Math.min(...ranges.map(range => range.pos)), to = Math.max(...ranges.map(range => range.pos + range.size));
  const { dom, text } = editor.view.serializeForClipboard(editor.state.doc.slice(from, to));
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([dom.innerHTML], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
  } catch { await navigator.clipboard.writeText(text).catch(() => undefined); }
}

/**
 * 블록 손잡이를 누르면 뜨는 메뉴의 내용. 위에는 블록의 종류, 그 아래로 색(글자색·배경색)과 종류 바꾸기(옆으로 펼쳐지는 하위
 * 메뉴), 서식 지우기, 복제·복사·링크 복사, 위·아래로 옮기기, 삭제가 묶음별로 놓인다. 단축키는 블록을 고른 채 누르면
 * 동작한다(RichEditor의 keys).
 */
export function BlockMenu({ editor, block, atomic, close, onStep }: {
  editor: Editor; block: MenuBlock; atomic: (fn: () => unknown) => void; close: () => void; onStep: (direction: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<'color' | 'turn' | null>(null), [place, setPlace] = useState<{ left: number; top: number } | null>(null);
  const node = editor.state.doc.nodeAt(block.pos);
  const isTextual = TEXTUAL.includes(block.type), canColor = isTextual && block.type !== 'codeBlock';
  const title = block.type === 'heading' ? `제목 ${node?.attrs.level ?? ''}` : TYPE_LABELS[block.type] ?? '블록';
  // 지금 입혀진 색: 블록의 첫 글자에 있는 것으로 본다.
  let ink = '', fill = '';
  node?.descendants(child => {
    if (!child.isText) return true;
    for (const mark of child.marks) { if (mark.type.name === 'textStyle') ink = mark.attrs.color ?? ''; if (mark.type.name === 'highlight') fill = mark.attrs.color ?? ''; }
    return false;
  });
  const current: TextBlockId | undefined = block.type === 'heading' ? `heading${node?.attrs.level}` as TextBlockId : TEXT_BLOCKS.find(each => each.id === block.type)?.id;

  // 하위 메뉴는 메뉴 오른쪽에(자리가 없으면 왼쪽에), 화면 밖으로 나가지 않게 놓는다.
  useLayoutEffect(() => {
    if (!sub || !root.current || !panel.current) { setPlace(null); return; }
    const menu = root.current.getBoundingClientRect(), item = root.current.querySelector<HTMLElement>(`[data-sub="${sub}"]`)?.getBoundingClientRect() ?? menu;
    const size = panel.current.getBoundingClientRect();
    const left = menu.right + 8 + size.width <= window.innerWidth - 8 ? menu.right + 8 : menu.left - 8 - size.width;
    setPlace({ left: Math.max(8, left), top: Math.max(8, Math.min(item.top - 6, window.innerHeight - size.height - 8)) });
  }, [sub]);

  /** 블록의 글 전체를 고른 채 명령을 돌리고, 커서를 블록 끝에 둔다(서식 도구가 따라 뜨지 않게). 한 번의 실행 취소 단위다. */
  const onBlock = (fn: () => unknown) => () => {
    atomic(() => {
      const { doc, tr } = editor.state;
      const from = TextSelection.near(doc.resolve(block.pos + 1), 1).from, to = TextSelection.near(doc.resolve(block.pos + block.size - 1), -1).to;
      editor.view.dispatch(tr.setSelection(TextSelection.create(doc, from, Math.max(from, to))));
      fn();
      const after = editor.state;
      editor.view.dispatch(after.tr.setSelection(TextSelection.near(after.doc.resolve(after.selection.to), -1)));
    });
    close();
  };
  const chain = () => editor.chain().focus();
  const then = (fn: () => unknown) => () => { fn(); close(); };
  const duplicate = () => { if (node) atomic(() => chain().insertContentAt(block.pos + block.size, node.toJSON()).run()); };
  const remove = () => atomic(() => chain().deleteRange({ from: block.pos, to: block.pos + block.size }).run());
  const keys = (event: KeyboardEvent) => {
    const inPanel = !!(event.target as HTMLElement).closest('[data-submenu]');
    if (sub && (event.key === 'Escape' || (inPanel && event.key === 'ArrowLeft'))) {
      event.preventDefault(); event.stopPropagation();
      const opener = root.current?.querySelector<HTMLButtonElement>(`[data-sub="${sub}"] button`);
      setSub(null); opener?.focus(); return;
    }
    if (!inPanel && event.key === 'ArrowRight') {
      const wrap = (event.target as HTMLElement).closest<HTMLElement>('[data-sub]');
      if (wrap) { event.preventDefault(); event.stopPropagation(); setSub(wrap.dataset.sub as 'color' | 'turn'); requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>('button')?.focus()); }
      return;
    }
    moveInMenu(event, inPanel ? panel.current : root.current);
  };
  // 포인터를 올리면 이미 열려 있으므로, 누르기는 닫지 않고 연다.
  const toggle = (name: 'color' | 'turn') => () => setSub(name);
  const leave = () => setSub(null);
  return <VStack ref={root} className={styles.menuBody} data-menu-scope="" onKeyDown={keys}>
    <MenuTitle>{title}</MenuTitle>
    <VStack data-sub="color" className={styles.contents}><MenuItem icon={icon('palette')} label="색" hasMore isOpen={sub === 'color'} isDisabled={!canColor} onSelect={toggle('color')} onPointerEnter={() => canColor && setSub('color')} /></VStack>
    <VStack data-sub="turn" className={styles.contents}><MenuItem icon={icon('turn-into')} label="종류 바꾸기" hasMore isOpen={sub === 'turn'} isDisabled={!isTextual} onSelect={toggle('turn')} onPointerEnter={() => isTextual && setSub('turn')} /></VStack>
    <MenuItem icon={icon('eraser')} label="서식 지우기" isDisabled={!canColor} onSelect={onBlock(() => chain().unsetAllMarks().run())} onPointerEnter={leave} />
    <MenuDivider />
    <MenuItem icon={icon('copy')} label="복제" hint={`${MOD} D`} onSelect={then(duplicate)} onPointerEnter={leave} />
    <MenuItem icon={icon('clipboard')} label="복사" hint={`${MOD} C`} onSelect={then(() => void copyBlocks(editor, [block]))} onPointerEnter={leave} />
    <MenuItem icon={icon('link-block')} label="링크 복사" onSelect={then(() => void navigator.clipboard.writeText(blockLink(block.id)).catch(() => undefined))} onPointerEnter={leave} />
    <MenuDivider />
    <MenuItem icon={icon('arrow-up')} label="위로 옮기기" hint="Alt ↑" onSelect={() => onStep(-1)} onPointerEnter={leave} />
    <MenuItem icon={icon('arrow-down')} label="아래로 옮기기" hint="Alt ↓" onSelect={() => onStep(1)} onPointerEnter={leave} />
    <MenuDivider />
    <MenuItem icon={icon('delete')} label="삭제" hint="Del" isDanger onSelect={then(remove)} onPointerEnter={leave} />
    {/* 하위 메뉴의 자리는 열 때 재서 정한다(인라인 위치). */}
    {sub ? <VStack ref={panel} className={`${styles.menu} ${styles.submenu}`} data-menu-scope="" data-submenu="" role="menu" aria-label={sub === 'color' ? '색' : '종류 바꾸기'}
      style={{ left: place?.left ?? -9999, top: place?.top ?? 0, visibility: place ? 'visible' : 'hidden' }}>
      {sub === 'color'
        ? <ColorList text={ink} background={fill}
          onText={color => onBlock(() => color ? chain().setColor(color).run() : chain().unsetColor().run())()}
          onBackground={color => onBlock(() => color ? chain().setHighlight({ color }).run() : chain().unsetHighlight().run())()} />
        : <TurnIntoList current={current} onSelect={id => onBlock(() => turnInto(editor, id))()} />}
    </VStack> : null}
  </VStack>;
}
