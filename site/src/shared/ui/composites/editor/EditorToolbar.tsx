import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useEffect, useReducer, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { ColorList, MOD, MenuItem, Swatch, TEXT_BLOCKS, TurnIntoList, keepSelection, moveInMenu, textBlockOf, turnInto } from './menus';
import type { EditorHandle } from './RichEditor';
import { COMMAND_ICONS, COMMANDS, type CommandId } from './schema';
import { AlignGlyph, LinkPanel } from './SelectionMenu';
import type { LinkChoice } from './types';
import styles from './editor.module.css';

type Panel = 'type' | 'color' | 'link' | 'align' | 'insert';

/** 넣기 메뉴의 블록: `/` 명령(COMMANDS)과 같은 이름·아이콘을 쓴다. 글 블록 종류는 블록 종류 메뉴가 맡는다. */
const INSERT_IDS: CommandId[] = ['table', 'file', 'codeBlock', 'mermaidBlock', 'blockquote', 'horizontalRule'];
const INSERTS = INSERT_IDS.map(id => ({ id, label: COMMANDS.find(command => command.id === id)!.label, icon: COMMAND_ICONS[id] }));

/** 되돌리기·다시 하기 그림(Solar에 없다): 굽은 화살표. */
function HistoryGlyph({ isRedo = false }: { isRedo?: boolean }) {
  return <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    style={isRedo ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M5.5 3.5 2.5 6.5l3 3" /><path d="M2.5 6.5h7a4 4 0 0 1 0 8H7" />
  </svg>;
}

/** 에디터가 바뀔 때마다(선택·입력) 다시 그려 눌림 상태를 맞춘다. */
function useEditorTick(handle: EditorHandle | null) {
  const [, tick] = useReducer((value: number) => value + 1, 0);
  useEffect(() => {
    const editor = handle?.editor;
    if (!editor) return undefined;
    editor.on('transaction', tick);
    return () => { editor.off('transaction', tick); };
  }, [handle?.editor]);
}

/**
 * 상단 서식 막대. 문서 편집기처럼 본문 위에 늘 붙어 있는 도구 줄이며, 글을 고르지 않아도 지금 커서 자리의 서식이 보인다.
 * 왼쪽부터 (start), 되돌리기, 블록 종류, 글자 서식, 색·링크, 정렬, 목록, 넣기 메뉴(표·파일·코드·도표·인용·구분선), 서식 지우기.
 * 위/아래 첨자와 들여쓰기·내어쓰기는 글을 고르면 뜨는 서식 도구의 더 보기와 Tab·Shift+Tab에 있다(막대를 한 줄로 두려고 뺐다).
 * 넣기는 `/` 명령과 같은 방식이라 파일은 올리는 칸이 뜬다. 좁으면 줄을 바꾼다. 핸들이 없으면(에디터 준비 전) 흐리게 그린다.
 */
export function EditorToolbar({ handle, links, start, end }: { handle: EditorHandle | null; links?: LinkChoice[]; start?: ReactNode; end?: ReactNode }) {
  useEditorTick(handle);
  const [open, setOpen] = useState<Panel | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const editor = handle?.editor ?? null;
  const isReady = !!editor && editor.isEditable;
  // 막대 밖을 누르면 펼친 것을 접는다.
  useEffect(() => {
    if (!open) return undefined;
    const close = (event: PointerEvent) => { if (!bar.current?.contains(event.target as Node)) setOpen(null); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  const chain = () => editor!.chain().focus();
  const active = (name: string, attrs?: Record<string, unknown>) => !!editor?.isActive(name, attrs);
  const tool = (label: string, drawing: ReactNode, run: () => unknown, options: { isActive?: boolean; isDisabled?: boolean; shortcut?: string } = {}) =>
    <Button label={label} tooltip={options.shortcut ? `${label} (${options.shortcut})` : label} variant="ghost" size="sm" isIconOnly icon={drawing}
      className={styles.tool} aria-pressed={options.isActive ?? undefined} isDisabled={!isReady || options.isDisabled}
      onMouseDown={keepSelection} onClick={() => { run(); }} />;
  const toggle = (panel: Panel) => () => setOpen(now => now === panel ? null : panel);
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(null); editor?.commands.focus(); return; }
    moveInMenu(event, (event.target as HTMLElement).closest<HTMLElement>('[data-menu-scope]'));
  };
  const divider = <Text className={styles.toolDivider} aria-hidden>{''}</Text>;
  const type = editor ? textBlockOf(editor) : 'paragraph';
  const ink = String(editor?.getAttributes('textStyle').color ?? ''), fill = String(editor?.getAttributes('highlight').color ?? '');
  const align = (editor?.getAttributes('paragraph').textAlign ?? editor?.getAttributes('heading').textAlign ?? 'left') as 'left' | 'center' | 'right' | 'justify';
  const ALIGN_LABELS = { left: '왼쪽 정렬', center: '가운데 정렬', right: '오른쪽 정렬', justify: '양쪽 정렬' } as const;
  // 도구는 좁으면 줄을 바꾸고, 오른쪽 끝(end: 보기 전환 등)은 늘 첫 줄 끝에 있다.
  return <HStack ref={bar} className={styles.toolbar} gap={2} vAlign="center">
    <HStack className={styles.toolbarTools} gap={0.5} vAlign="center" role="toolbar" aria-label="서식" onKeyDown={keys}>
    {start ? <>{start}{divider}</> : null}
    {tool('되돌리기', <HistoryGlyph />, () => chain().undo().run(), { isDisabled: !editor?.can().undo(), shortcut: `${MOD}+Z` })}
    {tool('다시 하기', <HistoryGlyph isRedo />, () => chain().redo().run(), { isDisabled: !editor?.can().redo(), shortcut: `${MOD}+Shift+Z` })}
    {divider}
    <HStack className={styles.toolAnchor}>
      <Button label={TEXT_BLOCKS.find(block => block.id === type)?.label ?? '텍스트'} variant="ghost" size="sm" className={`${styles.tool} ${styles.toolWide} ${styles.toolType}`}
        aria-label="블록 종류" aria-haspopup="menu" aria-expanded={open === 'type'} isDisabled={!isReady} onMouseDown={keepSelection} onClick={toggle('type')}
        endContent={icon('chevron-down')} />
      {open === 'type' && editor ? <VStack className={`${styles.menu} ${styles.pop} ${styles.popStart}`} data-menu-scope="" role="menu" aria-label="블록 종류">
        <TurnIntoList current={type} onSelect={id => { turnInto(editor, id); setOpen(null); }} />
      </VStack> : null}
    </HStack>
    {divider}
    {tool('굵게', icon('bold'), () => chain().toggleBold().run(), { isActive: active('bold'), shortcut: `${MOD}+B` })}
    {tool('기울임', icon('italic'), () => chain().toggleItalic().run(), { isActive: active('italic'), shortcut: `${MOD}+I` })}
    {tool('밑줄', icon('underline'), () => chain().toggleUnderline().run(), { isActive: active('underline'), shortcut: `${MOD}+U` })}
    {tool('취소선', icon('strike'), () => chain().toggleStrike().run(), { isActive: active('strike') })}
    {tool('인라인 코드', icon('code'), () => chain().toggleCode().run(), { isActive: active('code') })}
    {divider}
    <HStack className={styles.toolAnchor}>
      <Button label="색" tooltip="색" variant="ghost" size="sm" className={`${styles.tool} ${styles.toolWide}`} aria-haspopup="menu" aria-expanded={open === 'color'}
        isDisabled={!isReady} onMouseDown={keepSelection} onClick={toggle('color')} icon={<Swatch ink={ink || undefined} fill={fill || undefined} />} endContent={icon('chevron-down')}>{''}</Button>
      {open === 'color' ? <VStack className={`${styles.menu} ${styles.pop} ${styles.popStart}`} data-menu-scope="" role="menu" aria-label="색">
        <ColorList text={ink} background={fill}
          onText={color => { if (color) chain().setColor(color).run(); else chain().unsetColor().run(); setOpen(null); }}
          onBackground={color => { if (color) chain().setHighlight({ color }).run(); else chain().unsetHighlight().run(); setOpen(null); }} />
      </VStack> : null}
    </HStack>
    <HStack className={styles.toolAnchor}>
      <Button label="링크" tooltip={`링크 (${MOD}+K)`} variant="ghost" size="sm" isIconOnly icon={icon('link-block')} className={styles.tool} aria-pressed={active('link')}
        aria-haspopup="dialog" aria-expanded={open === 'link'} isDisabled={!isReady || (editor?.state.selection.empty && !active('link'))}
        onMouseDown={keepSelection} onClick={toggle('link')} />
      {open === 'link' && editor ? <LinkPanel editor={editor} links={links} onDone={() => setOpen(null)} /> : null}
    </HStack>
    {divider}
    <HStack className={styles.toolAnchor}>
      <Button label={ALIGN_LABELS[align]} tooltip="정렬" variant="ghost" size="sm" className={`${styles.tool} ${styles.toolWide}`} aria-label="정렬" aria-haspopup="menu"
        aria-expanded={open === 'align'} isDisabled={!isReady} onMouseDown={keepSelection} onClick={toggle('align')} icon={<AlignGlyph kind={align} />} endContent={icon('chevron-down')}>{''}</Button>
      {open === 'align' ? <HStack className={`${styles.selectionMenu} ${styles.pop} ${styles.popStart} ${styles.toolPopRow}`} gap={0.5} vAlign="center" role="group" aria-label="정렬">
        {(['left', 'center', 'right', 'justify'] as const).map(kind => <HStack key={kind} className={styles.contents}>
          {tool(ALIGN_LABELS[kind], <AlignGlyph kind={kind} />, () => { chain().setTextAlign(kind).run(); setOpen(null); }, { isActive: align === kind })}
        </HStack>)}
      </HStack> : null}
    </HStack>
    {tool('글머리 기호 목록', icon('list-bullet'), () => chain().toggleBulletList().run(), { isActive: active('bulletList') })}
    {tool('번호 매기기 목록', icon('list-ordered'), () => chain().toggleOrderedList().run(), { isActive: active('orderedList') })}
    {tool('할 일 목록', icon('list-task'), () => chain().toggleTaskList().run(), { isActive: active('taskList') })}
    {divider}
    <HStack className={styles.toolAnchor}>
      <Button label="넣기" tooltip="넣기 (표 · 이미지 · 코드 · 도표 · 인용 · 구분선)" variant="ghost" size="sm" className={`${styles.tool} ${styles.toolWide}`}
        aria-haspopup="menu" aria-expanded={open === 'insert'} isDisabled={!isReady} onMouseDown={keepSelection} onClick={toggle('insert')}
        icon={icon('plus')} endContent={icon('chevron-down')}>{''}</Button>
      {open === 'insert' ? <VStack className={`${styles.menu} ${styles.pop} ${styles.popStart}`} data-menu-scope="" role="menu" aria-label="넣기">
        {INSERTS.map(item => <MenuItem key={item.id} icon={icon(item.icon)} label={item.label} onSelect={() => { setOpen(null); handle?.insert(item.id); }} />)}
      </VStack> : null}
    </HStack>
    {divider}
    {tool('서식 지우기', icon('eraser'), () => chain().unsetAllMarks().run())}
    </HStack>
    {end ? <HStack className={styles.toolbarEnd} gap={2} vAlign="center">{end}</HStack> : null}
  </HStack>;
}
