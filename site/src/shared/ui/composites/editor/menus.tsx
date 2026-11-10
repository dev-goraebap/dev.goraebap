import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { Kbd } from '@astryxdesign/core/Kbd';
import { Text } from '@astryxdesign/core/Text';
import type { Editor } from '@tiptap/react';
import type { KeyboardEvent, ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import type { HeadingLevel } from './schema';
import styles from './editor.module.css';

/**
 * 에디터의 떠 있는 메뉴가 함께 쓰는 부품: 메뉴 한 줄(MenuItem), 글자색·배경색 목록(ColorList), 블록 종류 목록(TurnIntoList).
 * 블록 손잡이 메뉴, 글을 고르면 뜨는 서식 도구, 표 메뉴가 같은 모양을 쓴다.
 */

/**
 * 색 이름과 본문에 남는 색 값. 값은 에디터 색 변수(--editor-ink-*, --editor-fill-*)라서 라이트·다크에서 각자의 색으로 보인다.
 * 변수는 editor.module.css가 테마의 색 이름에서 만든다.
 */
const NAMES: [label: string, key: string][] = [['회색', 'gray'], ['갈색', 'brown'], ['주황색', 'orange'], ['노란색', 'yellow'], ['초록색', 'green'],
  ['파란색', 'blue'], ['보라색', 'purple'], ['분홍색', 'pink'], ['빨간색', 'red']];
export const COLORS: { name: string; ink: string; fill: string }[] = [
  { name: '기본', ink: '', fill: '' },
  ...NAMES.map(([name, key]) => ({ name, ink: `var(--editor-ink-${key})`, fill: `var(--editor-fill-${key})` })),
];

/** 맥에서는 ⌘, 그 밖에서는 Ctrl. 메뉴의 단축키 표기에 쓴다. */
export const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

/** 누를 때 본문의 선택이 풀리지 않게 한다. */
export const keepSelection = (event: { preventDefault: () => void }) => event.preventDefault();

/** 메뉴 한 줄: 아이콘, 이름, 그리고 오른쪽에 단축키·하위 메뉴 화살표·선택 표시 중 하나. */
export function MenuItem({ icon: drawing, label, hint, hasMore, isChecked, isDanger, isOpen, isDisabled, onSelect, onPointerEnter }: {
  icon?: ReactNode; label: string; hint?: string; hasMore?: boolean; isChecked?: boolean; isDanger?: boolean; isOpen?: boolean; isDisabled?: boolean;
  onSelect: () => void; onPointerEnter?: () => void;
}) {
  return <Button label={label} variant="ghost" size="sm" className={styles.menuItem} role="menuitem" aria-label={label} data-danger={isDanger ? '' : undefined}
    data-open={isOpen ? '' : undefined} aria-haspopup={hasMore ? 'menu' : undefined} aria-expanded={hasMore ? !!isOpen : undefined}
    isDisabled={isDisabled} icon={drawing} onMouseDown={keepSelection} onClick={onSelect} onPointerEnter={onPointerEnter}
    endContent={hint ? <Kbd keys={hint} className={`${styles.menuHint} ${styles.menuEnd}`} />
      : hasMore || isChecked ? <Text className={styles.menuEnd} aria-hidden>{icon(hasMore ? 'forward' : 'check')}</Text> : undefined} />;
}

export const MenuDivider = () => <Divider className={styles.menuDivider} />;
export const MenuTitle = ({ children }: { children: string }) => <Text type="supporting" color="secondary" weight="semibold" className={styles.menuTitle}>{children}</Text>;

/** 글자색과 배경색 목록. 빈 값은 기본(색 없음). */
export function ColorList({ text, background, onText, onBackground }: { text: string; background: string; onText: (color: string) => void; onBackground: (color: string) => void }) {
  return <>
    <MenuTitle>글자색</MenuTitle>
    {COLORS.map(color => <MenuItem key={`ink-${color.name}`} label={`${color.name} 글자`} isChecked={text === color.ink} onSelect={() => onText(color.ink)}
      icon={<Swatch ink={color.ink} />} />)}
    <MenuDivider />
    <MenuTitle>배경색</MenuTitle>
    {COLORS.map(color => <MenuItem key={`fill-${color.name}`} label={`${color.name} 배경`} isChecked={background === color.fill} onSelect={() => onBackground(color.fill)}
      icon={<Swatch fill={color.fill || 'var(--color-background-surface)'} isRound />} />)}
  </>;
}

/** 색 견본: 글자색은 A 한 글자, 배경색은 둥근 칸. 색은 견본마다 달라 인라인 변수로 준다. */
export function Swatch({ ink, fill, isRound = false }: { ink?: string; fill?: string; isRound?: boolean }) {
  return <Text className={isRound ? styles.fill : styles.ink} weight="semibold" aria-hidden
    style={{ ...(ink ? { color: ink } : {}), ...(fill ? { background: fill } : {}) }}>{isRound ? '' : 'A'}</Text>;
}

/** 서로 바꿀 수 있는 글 블록의 종류. glyph는 메뉴에 보이는 짧은 표시다. */
export const TEXT_BLOCKS = [
  { id: 'paragraph', label: '텍스트', glyph: 'T' },
  { id: 'heading2', label: '제목 2', glyph: 'H2' }, { id: 'heading3', label: '제목 3', glyph: 'H3' }, { id: 'heading4', label: '제목 4', glyph: 'H4' },
  { id: 'bulletList', label: '글머리 목록', glyph: '•' }, { id: 'orderedList', label: '번호 목록', glyph: '1.' }, { id: 'taskList', label: '할 일 목록', glyph: '☑' },
  { id: 'blockquote', label: '인용', glyph: '❞' }, { id: 'codeBlock', label: '코드', glyph: '</>' },
] as const;
export type TextBlockId = typeof TEXT_BLOCKS[number]['id'];

/** 커서가 있는 글 블록의 종류. 목록·인용 안의 문단은 그 목록·인용으로 본다. */
export function textBlockOf(editor: Editor): TextBlockId {
  if (editor.isActive('heading')) return `heading${editor.getAttributes('heading').level}` as TextBlockId;
  for (const id of ['bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock'] as const) if (editor.isActive(id)) return id;
  return 'paragraph';
}

/** 고른 글 블록을 다른 종류로 바꾼다. 먼저 목록·인용을 풀어 문단으로 만든 뒤(clearNodes) 새 종류를 입힌다. */
export function turnInto(editor: Editor, id: TextBlockId) {
  const chain = editor.chain().focus().clearNodes();
  if (id.startsWith('heading')) return chain.setHeading({ level: Number(id.slice(-1)) as HeadingLevel }).run();
  if (id === 'bulletList') return chain.toggleBulletList().run();
  if (id === 'orderedList') return chain.toggleOrderedList().run();
  if (id === 'taskList') return chain.toggleTaskList().run();
  if (id === 'blockquote') return chain.setBlockquote().run();
  if (id === 'codeBlock') return chain.setCodeBlock().run();
  return chain.run();
}

export function TurnIntoList({ current, onSelect }: { current?: TextBlockId; onSelect: (id: TextBlockId) => void }) {
  return <>
    <MenuTitle>종류 바꾸기</MenuTitle>
    {TEXT_BLOCKS.map(block => <MenuItem key={block.id} label={block.label} isChecked={current === block.id} onSelect={() => onSelect(block.id)}
      icon={<Text className={styles.glyph} weight="semibold">{block.glyph}</Text>} />)}
  </>;
}

/** 메뉴 안에서 위·아래 화살표와 Home·End로 항목을 옮겨 다닌다. 메뉴는 data-menu-scope로 범위를 정한다. 다룬 키면 true. */
export function moveInMenu(event: KeyboardEvent, scope: HTMLElement | null): boolean {
  // Alt+↑·↓는 블록 옮기기 단축키라 메뉴가 열린 채로도 블록에 간다.
  if (!scope || event.altKey || event.ctrlKey || event.metaKey || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return false;
  const items = Array.from(scope.querySelectorAll<HTMLButtonElement>('button:not(:disabled):not([aria-disabled="true"])'))
    .filter(item => item.closest('[data-menu-scope]') === scope);
  const at = items.indexOf(document.activeElement as HTMLButtonElement);
  items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (at + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  event.preventDefault();
  event.stopPropagation();
  return true;
}
