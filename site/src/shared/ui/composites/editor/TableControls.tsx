import { Button } from '@astryxdesign/core/Button';
import { VStack } from '@astryxdesign/core/VStack';
import { TextSelection } from '@tiptap/pm/state';
import { moveTableColumn, moveTableRow, selectedRect } from '@tiptap/pm/tables';
import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { MenuItem, keepSelection, moveInMenu } from './menus';
import styles from './editor.module.css';

/** 손잡이·단추가 놓일 자리(에디터 틀 기준 px). 표가 가로로 넘치면 보이는 부분에 맞춘다. */
type Box = { left: number; top: number; width: number; height: number; row?: { top: number; height: number }; col?: { left: number; width: number } };
type Menu = { kind: 'row' | 'col' | 'table'; left: number; top: number };
type Item = [label: string, drawing: ReactNode, run: () => unknown, isEnabled?: boolean, isDanger?: boolean];
const MENU_WIDTH = 208, ROW_HEIGHT = 33;
const LABEL = { row: '행 메뉴', col: '열 메뉴', table: '표 메뉴' } as const;

const cellOf = (node: EventTarget | Node | null) => (node instanceof Element ? node : node instanceof Node ? node.parentElement : null)?.closest<HTMLTableCellElement>('td,th') ?? null;

/**
 * 표 둘레의 편집 도구. 표 바로 옆에서 고친다: 포인터가 있는 칸(없으면 커서가 있는 칸)의 행 왼쪽·열 위쪽에 손잡이가 뜨고,
 * 누르면 그 행·열의 메뉴(추가·이동·머리글·삭제)가 열린다. 표 오른쪽·아래 가장자리의 + 막대는 끝에 열·행을 더하고, 왼쪽 위
 * 모서리 단추는 표 전체의 메뉴(셀 병합·나누기·머리글·표 삭제)다. 열 너비는 열 경계를 끌어 바꾼다(ResizableTable).
 * 병합된 칸이 섞인 표에서는 손잡이가 그 칸의 첫 행·열을 가리키며, 터치 화면에서는 커서가 있는 칸 기준으로만 뜬다.
 * 손잡이 자리는 표를 재서 정하므로 인라인 위치를 쓴다.
 */
export function TableControls({ editor, host, atomic }: { editor: Editor; host: RefObject<HTMLElement | null>; atomic: (fn: () => unknown) => void }) {
  const [hover, setHover] = useState<HTMLTableCellElement | null>(null), [box, setBox] = useState<Box | null>(null), [menu, setMenu] = useState<Menu | null>(null), [tick, setTick] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null), leave = useRef<number | undefined>(undefined), frozen = useRef<HTMLTableCellElement | null>(null);
  // 지금 가리키는 칸: 메뉴가 열려 있으면 그 칸을 붙잡고, 아니면 포인터가 있는 칸, 그것도 없으면 커서가 있는 칸.
  const caretCell = useCallback(() => { try { return cellOf(editor.view.domAtPos(editor.state.selection.from).node); } catch { return null; } }, [editor]);
  const current = useCallback(() => { const cell = frozen.current ?? hover; return cell?.isConnected && editor.view.dom.contains(cell) ? cell : caretCell(); }, [editor, hover, caretCell]);

  const measure = useCallback(() => {
    const frame = host.current, cell = current(), table = cell?.closest('table'), wrapper = table?.closest<HTMLElement>('.tableWrapper') ?? table;
    if (!frame || !cell || !table || !wrapper) { setBox(null); return; }
    const origin = frame.getBoundingClientRect(), outer = wrapper.getBoundingClientRect(), inner = table.getBoundingClientRect();
    const row = cell.parentElement!.getBoundingClientRect(), own = cell.getBoundingClientRect();
    const left = Math.max(outer.left, inner.left), right = Math.min(outer.right, inner.right), center = own.left + own.width / 2;
    setBox({ left: left - origin.left, top: inner.top - origin.top, width: right - left, height: inner.height, row: { top: row.top - origin.top, height: row.height },
      col: center >= left && center <= right ? { left: own.left - origin.left, width: own.width } : undefined });
  }, [host, current]);
  useLayoutEffect(measure, [measure, tick]);
  // 본문이 바뀌거나 커서가 옮겨 가면, 창 크기가 바뀌면, 넘치는 표를 가로로 굴리면 다시 잰다.
  useEffect(() => {
    const again = () => setTick(value => value + 1);
    editor.on('transaction', again); window.addEventListener('resize', again);
    const frame = host.current, scrolled = (event: Event) => { if ((event.target as Element | null)?.classList?.contains('tableWrapper')) again(); };
    frame?.addEventListener('scroll', scrolled, true);
    return () => { editor.off('transaction', again); window.removeEventListener('resize', again); frame?.removeEventListener('scroll', scrolled, true); };
  }, [editor, host]);
  // 포인터가 표의 칸 위에 있으면 그 칸을, 도구 위에 있으면 그대로 두고, 벗어나면 잠시 뒤 놓는다(칸에서 손잡이로 건너갈 틈).
  useEffect(() => {
    const frame = host.current;
    if (!frame) return;
    const later = () => { window.clearTimeout(leave.current); leave.current = window.setTimeout(() => setHover(null), 220); };
    const moved = (event: globalThis.MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('[data-table-controls]')) { window.clearTimeout(leave.current); return; }
      const cell = cellOf(target);
      if (cell && editor.view.dom.contains(cell)) { window.clearTimeout(leave.current); setHover(cell); } else later();
    };
    frame.addEventListener('mousemove', moved); frame.addEventListener('mouseleave', later);
    return () => { window.clearTimeout(leave.current); frame.removeEventListener('mousemove', moved); frame.removeEventListener('mouseleave', later); };
  }, [editor, host]);
  const close = useCallback(() => { frozen.current = null; setMenu(null); }, []);
  // 메뉴: 바깥을 누르거나 화면을 굴리면 닫는다. 열리면 첫 항목에 초점을 둔다.
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
    const outside = (event: globalThis.MouseEvent) => { if (!(event.target as Element | null)?.closest('[data-table-controls]')) close(); };
    document.addEventListener('mousedown', outside, true); window.addEventListener('scroll', close, true);
    return () => { document.removeEventListener('mousedown', outside, true); window.removeEventListener('scroll', close, true); };
  }, [menu, close]);

  if (!box) return null;
  /** 커서를 그 칸 안에 둔다(표 명령은 커서가 있는 칸을 기준으로 움직인다). */
  const into = (cell: HTMLTableCellElement | null) => {
    if (!cell?.isConnected) return false;
    const pos = editor.view.posAtDOM(cell, 0), { doc, tr } = editor.state;
    editor.view.dispatch(tr.setSelection(TextSelection.near(doc.resolve(Math.min(pos + 1, doc.content.size)))));
    return true;
  };
  const open = (kind: Menu['kind']) => (event: MouseEvent<HTMLButtonElement>) => {
    if (menu?.kind === kind) { close(); return; }
    frozen.current = current();
    const at = event.currentTarget.getBoundingClientRect(), count = kind === 'table' ? 5 : 6;
    const left = kind === 'col' ? at.left : at.right + 6, top = kind === 'col' ? at.bottom + 6 : at.top;
    setMenu({ kind, left: Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8)), top: Math.max(8, Math.min(top, window.innerHeight - count * ROW_HEIGHT - 24)) });
  };
  /** 손잡이가 가리키는 칸에 커서를 두고 명령을 한 번의 실행 취소 단위로 돌린 뒤 메뉴를 닫는다. */
  const act = (fn: () => unknown, keepsSelection = false) => () => {
    const cell = frozen.current ?? current();
    close(); setHover(null);
    atomic(() => { if (!keepsSelection || caretCell()?.closest('table') !== cell?.closest('table')) into(cell); fn(); });
    editor.commands.focus();
  };
  const chain = () => editor.chain().focus();
  const shift = (axis: 'row' | 'col', by: number) => () => {
    const rect = selectedRect(editor.state), from = axis === 'row' ? rect.top : rect.left, size = axis === 'row' ? rect.map.height : rect.map.width, to = from + by;
    if (to < 0 || to >= size) return;
    (axis === 'row' ? moveTableRow : moveTableColumn)({ from, to })(editor.state, editor.view.dispatch);
  };
  /** 끝에 행·열을 더한다: 마지막 칸에 커서를 두고 그 뒤에 더한다. */
  const extend = (axis: 'row' | 'col') => () => {
    const cells = current()?.closest('table')?.querySelectorAll<HTMLTableCellElement>('td,th'), last = cells?.[cells.length - 1] ?? null;
    setHover(null);
    atomic(() => { if (into(last)) (axis === 'row' ? chain().addRowAfter() : chain().addColumnAfter()).run(); });
  };
  const items: Record<Menu['kind'], Item[]> = {
    row: [['위에 행 추가', icon('arrow-up'), () => chain().addRowBefore().run()], ['아래에 행 추가', icon('arrow-down'), () => chain().addRowAfter().run()],
      ['위로 옮기기', icon('arrow-up'), shift('row', -1)], ['아래로 옮기기', icon('arrow-down'), shift('row', 1)],
      ['머리글 행 켜기·끄기', icon('table'), () => chain().toggleHeaderRow().run()], ['행 삭제', icon('delete'), () => chain().deleteRow().run(), true, true]],
    col: [['왼쪽에 열 추가', icon('arrow-left'), () => chain().addColumnBefore().run()], ['오른쪽에 열 추가', icon('arrow-right'), () => chain().addColumnAfter().run()],
      ['왼쪽으로 옮기기', icon('arrow-left'), shift('col', -1)], ['오른쪽으로 옮기기', icon('arrow-right'), shift('col', 1)],
      ['머리글 열 켜기·끄기', icon('table'), () => chain().toggleHeaderColumn().run()], ['열 삭제', icon('delete'), () => chain().deleteColumn().run(), true, true]],
    table: [['셀 병합', icon('plus'), () => chain().mergeCells().run(), editor.can().mergeCells()], ['셀 나누기', icon('table'), () => chain().splitCell().run(), editor.can().splitCell()],
      ['머리글 행 켜기·끄기', icon('table'), () => chain().toggleHeaderRow().run()], ['머리글 열 켜기·끄기', icon('table'), () => chain().toggleHeaderColumn().run()],
      ['표 삭제', icon('delete'), () => chain().deleteTable().run(), true, true]],
  };
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); editor.commands.focus(); return; }
    moveInMenu(event, menuRef.current);
  };
  const handle = (kind: Menu['kind'], place: CSSProperties, drawing: ReactNode) => <Button label={LABEL[kind]} tooltip={LABEL[kind]} variant="ghost" isIconOnly icon={drawing}
    className={`${styles.tableHandle} ${styles[`tableHandle-${kind}`]}`} style={place} aria-haspopup="menu" aria-expanded={menu?.kind === kind}
    onMouseDown={keepSelection} onClick={open(kind)} />;
  return <VStack className={styles.tableControls} data-table-controls="" aria-label="표 편집">
    {handle('table', { left: box.left - 9, top: box.top - 9 }, icon('more'))}
    {box.row ? handle('row', { left: box.left - 8, top: box.row.top + box.row.height / 2 - 11 }, icon('grip')) : null}
    {box.col ? handle('col', { left: box.col.left + box.col.width / 2 - 11, top: box.top - 8 }, icon('more')) : null}
    <Button label="끝에 열 추가" tooltip="끝에 열 추가" variant="ghost" isIconOnly icon={icon('plus')} className={`${styles.tableAdd} ${styles.tableAddCol}`}
      style={{ left: box.left + box.width + 4, top: box.top, height: box.height }} onMouseDown={keepSelection} onClick={extend('col')} />
    <Button label="끝에 행 추가" tooltip="끝에 행 추가" variant="ghost" isIconOnly icon={icon('plus')} className={`${styles.tableAdd} ${styles.tableAddRow}`}
      style={{ left: box.left, top: box.top + box.height + 4, width: box.width }} onMouseDown={keepSelection} onClick={extend('row')} />
    {menu ? <VStack ref={menuRef} className={`${styles.menu} ${styles.tableMenu}`} data-menu-scope="" style={{ left: menu.left, top: menu.top }} role="menu"
      aria-label={LABEL[menu.kind]} onKeyDown={keys}>
      {items[menu.kind].map(([text, drawing, run, isEnabled = true, isDanger]) =>
        <MenuItem key={text} icon={drawing} label={text} isDisabled={!isEnabled} isDanger={isDanger} onSelect={act(run, menu.kind === 'table')} />)}
    </VStack> : null}
  </VStack>;
}
