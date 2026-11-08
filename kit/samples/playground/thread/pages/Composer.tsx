import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './thread.module.css';

/** 키보드가 올라온 만큼(보이는 영역이 줄어든 만큼)을 CSS 변수로 알린다. 입력 칸이 키보드 위로 올라오게 한다. */
function useKeyboardInset(target: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = target.current;
    if (!viewport || !element) return undefined;
    const update = () => element.style.setProperty('--keyboard-inset', `${Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))}px`);
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => { viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update); };
  }, [target]);
}

/** caret 앞이 "@글자"로 끝나면 그 글자와 시작 위치. */
const mentionAt = (value: string, caret: number) => {
  const match = /(^|\s)@([^\s@]*)$/.exec(value.slice(0, caret));
  return match ? { start: caret - match[2].length - 1, query: match[2] } : undefined;
};

/**
 * 대화 입력 칸: Enter로 보내고 Shift+Enter로 줄을 바꾼다(한글 조합 중에는 보내지 않는다). @를 치면 방 사람을 골라 넣는다
 * (위·아래로 옮기고 Enter·Tab으로 고르고 Esc로 닫는다). 보내기 버튼은 비어 있어도 막지 않고 입력 칸으로 초점을 돌린다.
 * 휴대폰은 홈 표시줄과 키보드를 피해 입력 칸이 올라온다. before에는 입력 칸 위에 뜨는 것(새 글 알림)을 둔다.
 */
export function Composer({ people, onSend, before }: { people: string[]; onSend: (body: string) => void; before?: ReactNode }) {
  const [value, setValue] = useState('');
  const [mention, setMention] = useState<{ start: number; query: string } | undefined>();
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  useKeyboardInset(root);
  const options = mention ? people.filter(name => name.includes(mention.query)) : [];
  const isListOpen = !!mention && options.length > 0;
  const field = () => root.current?.querySelector('textarea') ?? undefined;

  const change = (next: string, caret: number | undefined) => {
    setValue(next);
    setMention(caret === undefined ? undefined : mentionAt(next, caret));
    setActive(0);
  };
  const pick = (name: string) => {
    const area = field();
    if (!mention || !area) return;
    const caret = area.selectionStart;
    const next = `${value.slice(0, mention.start)}@${name} ${value.slice(caret)}`;
    const position = mention.start + name.length + 2;
    setValue(next);
    setMention(undefined);
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(position, position); });
  };
  const send = () => {
    const body = value.trim();
    if (!body) { field()?.focus(); return; }
    onSend(body);
    setValue('');
    setMention(undefined);
    field()?.focus();
  };
  const keys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.nativeEvent.isComposing || (event.target as HTMLElement).tagName !== 'TEXTAREA') return;
    if (isListOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(index => (index + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') { event.preventDefault(); pick(options[active]); return; }
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setMention(undefined); return; }
    }
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); }
  };

  return <div ref={root} className={styles.composer} onKeyDown={keys}>
    {before}
    {isListOpen ? <ul id={listId} role="listbox" aria-label="멘션할 사람" className={styles.mentions}>
      {options.map((name, index) => <li key={name} role="option" aria-selected={index === active} className={styles.mentionOption}
        onMouseDown={event => event.preventDefault()} onClick={() => pick(name)}>
        <Avatar name={name} size="xsm" shape="circle" /><Text>{name}</Text>
      </li>)}
    </ul> : null}
    <div className={styles.composerRow}>
      <div className={styles.field}>
        <TextArea label="메시지" isLabelHidden placeholder="메시지를 입력하세요. @로 사람을 부를 수 있습니다." rows={Math.min(4, Math.max(1, value.split('\n').length))}
          value={value} onChange={(next, event) => change(next, event.target.selectionStart)} />
      </div>
      <Button label="보내기" variant="create" onClick={send} />
    </div>
  </div>;
}
