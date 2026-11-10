import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import type { Editor } from '@tiptap/react';
import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { ColorList, MenuItem, MenuTitle, Swatch, TEXT_BLOCKS, TurnIntoList, keepSelection, moveInMenu, textBlockOf, turnInto } from './menus';
import type { LinkChoice } from './types';
import styles from './editor.module.css';

type Panel = 'type' | 'color' | 'more' | 'link';

/** 줄 정렬 그림: 길이가 다른 가로줄 넷을 정렬 방향에 맞춰 놓는다(Solar에 글 정렬 아이콘이 없다). */
export function AlignGlyph({ kind }: { kind: 'left' | 'center' | 'right' | 'justify' }) {
  const widths = kind === 'justify' ? [14, 14, 14, 14] : [14, 9, 12, 7];
  return <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    {widths.map((width, row) => { const start = kind === 'center' ? (16 - width) / 2 : kind === 'right' ? 15 - width : 1; return <path key={row} d={`M${start} ${3 + row * 3.3}h${width}`} />; })}
  </svg>;
}
/** 들여쓰기·내어쓰기 그림: 줄 셋과 방향 화살표. */
export function IndentGlyph({ isOut = false }: { isOut?: boolean }) {
  return <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h8M7 8h8M7 13h8" /><path d={isOut ? 'M4 5.5 1.5 8 4 10.5' : 'M1.5 5.5 4 8 1.5 10.5'} />
  </svg>;
}
export const Script = ({ isUp }: { isUp: boolean }) => <Text className={styles.script} weight="semibold">x{isUp ? <sup>2</sup> : <sub>2</sub>}</Text>;

/** 주소로 쓸 수 있게 다듬는다: 앱 안의 주소(/…)와 https · http · mailto는 그대로, 점이 든 낱말(example.com)은 https://를 붙인다. 그 밖은 빈 글. */
export function hrefOf(text: string): string {
  const value = text.trim();
  if (/^(https?:\/\/|mailto:)/i.test(value) || /^\/(?!\/)/.test(value)) return value;
  return /^[^\s/]+\.[^\s]{2,}$/.test(value) ? `https://${value}` : '';
}

/**
 * 링크 입력 칸: 주소를 붙여 넣거나, 문서 이름을 쳐서 호스트가 넘긴 문서(links)를 골라 건다. Enter는 주소면 그 주소로,
 * 아니면 맨 위 문서로 건다. 이미 링크가 걸린 글이면 열기와 지우기가 함께 보인다.
 */
export function LinkPanel({ editor, links, onDone }: { editor: Editor; links?: LinkChoice[]; onDone: () => void }) {
  const current = String(editor.getAttributes('link').href ?? '');
  const [text, setText] = useState(current);
  const href = hrefOf(text), word = text.trim().toLowerCase();
  const found = !href && word && links ? links.filter(link => link.title.toLowerCase().includes(word)).slice(0, 7) : !text.trim() && links ? links.slice(0, 5) : [];
  const apply = (target: string) => { editor.chain().focus().extendMarkRange('link').setLink({ href: target }).run(); onDone(); };
  const submit = () => { if (href) apply(href); else if (found[0]) apply(found[0].href); };
  return <VStack className={`${styles.menu} ${styles.pop} ${styles.popStart} ${styles.linkPop}`} data-menu-scope="" role="dialog" aria-label="링크">
    <HStack className={styles.linkRow} gap={1.5} vAlign="center">
      {icon('link-block')}
      <TextInput label="링크 주소 또는 문서 이름" isLabelHidden hasAutoFocus value={text} className={styles.linkInput}
        placeholder={links ? '주소를 붙여 넣거나 문서 이름으로 찾기' : '주소를 붙여 넣기 (https://…)'}
        onChange={setText} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); submit(); } }} />
      {current ? <>
        <Button label="링크 열기" tooltip="링크 열기" variant="ghost" size="sm" isIconOnly icon={icon('external')} href={current} target="_blank" rel="noopener noreferrer" />
        <Button label="링크 지우기" tooltip="링크 지우기" variant="ghost" size="sm" isIconOnly icon={icon('delete')} onMouseDown={keepSelection}
          onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); onDone(); }} />
      </> : null}
    </HStack>
    {href && href !== current ? <MenuItem icon={icon('link-block')} label={`${href} 로 연결`} hint="Enter" onSelect={() => apply(href)} /> : null}
    {found.length > 0 ? <><MenuTitle>문서</MenuTitle>{found.map(link => <MenuItem key={link.href} icon={icon('document')} label={link.title} hint={link.hint} onSelect={() => apply(link.href)} />)}</> : null}
    {!href && word && !found.length
      ? <Text type="supporting" color="secondary" className={styles.linkEmpty}>{links ? '찾은 문서가 없습니다. 주소는 https://로 시작해 주세요.' : 'https:// 또는 mailto:로 시작하는 주소를 넣어 주세요.'}</Text>
      : null}
  </VStack>;
}

/**
 * 글을 고르면 그 위에 뜨는 서식 도구. 왼쪽부터 블록 종류, 굵게·기울임·밑줄·취소선·코드, 링크, 색, 더 보기다. 종류 · 링크 · 색은
 * 도구 아래로 펼쳐지고, 더 보기는 도구 위에 한 줄(위·아래 첨자, 줄 정렬, 내어쓰기·들여쓰기, 서식 지우기)이 뜬다.
 */
export function SelectionMenu({ editor, links }: { editor: Editor; links?: LinkChoice[] }) {
  const [open, setOpen] = useState<Panel | null>(null);
  const isEmpty = editor.state.selection.empty;
  // 선택이 풀려 도구가 사라지면 펼친 것도 접는다.
  useEffect(() => { if (isEmpty) setOpen(null); }, [isEmpty]);
  const chain = () => editor.chain().focus();
  const tool = (label: string, isActive: boolean, run: () => unknown, drawing: ReactNode, isDisabled = false) =>
    <Button label={label} tooltip={label} variant="ghost" size="sm" isIconOnly icon={drawing} className={styles.tool} aria-pressed={isActive}
      isDisabled={isDisabled} onMouseDown={keepSelection} onClick={() => { run(); }} />;
  const toggle = (panel: Panel) => () => setOpen(now => now === panel ? null : panel);
  const type = textBlockOf(editor), ink = String(editor.getAttributes('textStyle').color ?? ''), fill = String(editor.getAttributes('highlight').color ?? '');
  const align = editor.getAttributes('paragraph').textAlign ?? editor.getAttributes('heading').textAlign ?? 'left';
  const listItem = editor.isActive('taskItem') ? 'taskItem' : 'listItem';
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(null); editor.commands.focus(); return; }
    moveInMenu(event, (event.target as HTMLElement).closest<HTMLElement>('[data-menu-scope]'));
  };
  const divider = <Text className={styles.toolDivider} aria-hidden>{''}</Text>;
  return <HStack className={styles.selectionMenu} gap={0.5} vAlign="center" role="toolbar" aria-label="선택 텍스트 서식" onKeyDown={keys}>
    <Button label={TEXT_BLOCKS.find(block => block.id === type)?.label ?? '텍스트'} variant="ghost" size="sm" className={`${styles.tool} ${styles.toolWide}`}
      aria-label="블록 종류" aria-haspopup="menu" aria-expanded={open === 'type'} onMouseDown={keepSelection} onClick={toggle('type')} endContent={icon('chevron-down')} />
    {divider}
    {tool('굵게', editor.isActive('bold'), () => chain().toggleBold().run(), icon('bold'))}
    {tool('기울임', editor.isActive('italic'), () => chain().toggleItalic().run(), icon('italic'))}
    {tool('밑줄', editor.isActive('underline'), () => chain().toggleUnderline().run(), icon('underline'))}
    {tool('취소선', editor.isActive('strike'), () => chain().toggleStrike().run(), icon('strike'))}
    {tool('인라인 코드', editor.isActive('code'), () => chain().toggleCode().run(), icon('code'))}
    {divider}
    <Button label="링크" tooltip="링크" variant="ghost" size="sm" isIconOnly icon={icon('link-block')} className={styles.tool} aria-pressed={editor.isActive('link')}
      aria-haspopup="dialog" aria-expanded={open === 'link'} onMouseDown={keepSelection} onClick={toggle('link')} />
    <Button label="색" tooltip="색" variant="ghost" size="sm" className={`${styles.tool} ${styles.toolWide}`} aria-haspopup="menu" aria-expanded={open === 'color'}
      onMouseDown={keepSelection} onClick={toggle('color')} icon={<Swatch ink={ink || undefined} fill={fill || undefined} />} endContent={icon('chevron-down')}>{''}</Button>
    {divider}
    <Button label="더 보기" tooltip="더 보기" variant="ghost" size="sm" isIconOnly icon={icon('more')} className={`${styles.tool} ${styles.moreTool}`}
      aria-haspopup="true" aria-expanded={open === 'more'} onMouseDown={keepSelection} onClick={toggle('more')} />
    {open === 'link' ? <LinkPanel editor={editor} links={links} onDone={() => setOpen(null)} /> : null}
    {open === 'type' ? <VStack className={`${styles.menu} ${styles.pop} ${styles.popStart}`} data-menu-scope="" role="menu" aria-label="블록 종류">
      <TurnIntoList current={type} onSelect={id => { turnInto(editor, id); setOpen(null); }} />
    </VStack> : null}
    {open === 'color' ? <VStack className={`${styles.menu} ${styles.pop} ${styles.popEnd}`} data-menu-scope="" role="menu" aria-label="색">
      <ColorList text={ink} background={fill}
        onText={color => { if (color) chain().setColor(color).run(); else chain().unsetColor().run(); setOpen(null); }}
        onBackground={color => { if (color) chain().setHighlight({ color }).run(); else chain().unsetHighlight().run(); setOpen(null); }} />
    </VStack> : null}
    {open === 'more' ? <HStack className={`${styles.selectionMenu} ${styles.popRow}`} gap={0.5} vAlign="center" role="group" aria-label="더 많은 서식">
      {tool('위 첨자', editor.isActive('superscript'), () => chain().toggleSuperscript().run(), <Script isUp />)}
      {tool('아래 첨자', editor.isActive('subscript'), () => chain().toggleSubscript().run(), <Script isUp={false} />)}
      {divider}
      {(['left', 'center', 'right', 'justify'] as const).map(kind => <HStack key={kind} className={styles.contents}>
        {tool({ left: '왼쪽 정렬', center: '가운데 정렬', right: '오른쪽 정렬', justify: '양쪽 정렬' }[kind], align === kind, () => chain().setTextAlign(kind).run(), <AlignGlyph kind={kind} />)}
      </HStack>)}
      {divider}
      {tool('내어쓰기', false, () => chain().liftListItem(listItem).run(), <IndentGlyph isOut />, !editor.can().liftListItem(listItem))}
      {tool('들여쓰기', false, () => chain().sinkListItem(listItem).run(), <IndentGlyph />, !editor.can().sinkListItem(listItem))}
      {divider}
      {tool('서식 지우기', false, () => chain().unsetAllMarks().run(), icon('eraser'))}
    </HStack> : null}
  </HStack>;
}
