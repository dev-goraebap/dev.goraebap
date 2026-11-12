import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ArrowUpIcon } from '@/shared/ui/icon';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';

/** 키보드가 올라온 만큼(보이는 영역이 줄어든 만큼)을 CSS 변수로 알린다. 입력 칸이 키보드 위로 올라오게 한다. */
function useKeyboardInset(target: RefObject<HTMLElement | null>) {
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

/** 커서 앞의 "@찾는말". 없으면 undefined. */
const mentionAt = (value: string, caret: number) => /(?:^|\s)@([^\s@]*)$/.exec(value.slice(0, caret))?.[1];

/**
 * 대화 입력 칸: Enter로 보내고 Shift+Enter로 줄을 바꾼다(한글 조합 중에는 보내지 않는다). @를 치면 방 사람을 골라 넣는다
 * (위·아래로 옮기고 Enter·Tab으로 고르고 Esc로 닫는다: 콤보 상자와 목록). 보내기 버튼은 비어 있어도 막지 않고 입력 칸으로 초점을 돌린다.
 * 휴대폰은 홈 표시줄과 키보드를 피해 입력 칸이 올라오고, 글자는 16px라 확대되지 않는다. before에는 입력 칸 위에 뜨는 것(새 글 알림)을 둔다.
 */
export function Composer({ people, onSend, before }: { people: string[]; onSend: (body: string) => void; before?: ReactNode }) {
  const [value, setValue] = useState('');
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [isDismissed, setDismissed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const listId = useId();
  useKeyboardInset(root);
  const query = mentionAt(value, caret);
  const options = query === undefined || isDismissed ? [] : people.filter(name => name.includes(query));
  const isOpen = options.length > 0;
  const send = () => {
    field.current?.focus();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue('');
    setCaret(0);
  };
  const pick = (name: string) => {
    const before = value.slice(0, caret).replace(/@[^\s@]*$/, `@${name} `);
    const next = before + value.slice(caret);
    setValue(next);
    setCaret(before.length);
    requestAnimationFrame(() => { field.current?.focus(); field.current?.setSelectionRange(before.length, before.length); });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') { event.preventDefault(); pick(options[Math.min(active, options.length - 1)]); return; }
      if (event.key === 'Escape') { event.preventDefault(); setDismissed(true); return; }
    }
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); }
  };
  const track = (element: HTMLTextAreaElement) => { setCaret(element.selectionStart); setDismissed(false); setActive(0); };
  return (
    <div ref={root}
      className="relative shrink-0 border-t bg-background px-[max(1rem,calc((100%-45rem)/2))] py-3 max-md:px-4 max-md:pt-2 max-md:pb-[calc(0.5rem+max(var(--keyboard-inset,0px),env(safe-area-inset-bottom)))]">
      {before}
      {isOpen ? (
        <ul id={listId} role="listbox" aria-label="멘션할 사람"
          className="absolute bottom-full left-[max(1rem,calc((100%-45rem)/2))] z-2 mb-1 flex w-64 flex-col rounded-xl border bg-popover p-1 text-popover-foreground shadow-md">
          {options.map((name, index) => (
            <li key={name} id={`${listId}-${index}`} role="option" aria-selected={index === active}
              // 누르는 동안 입력 칸이 초점을 잃지 않게 한다.
              onMouseDown={event => event.preventDefault()} onClick={() => pick(name)}
              className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm aria-selected:bg-accent max-md:min-h-11">
              <PersonAvatar name={name} />{name}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-end gap-2">
        <textarea ref={field} role="combobox" aria-label="메시지" aria-autocomplete="list" aria-expanded={isOpen} aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={isOpen ? `${listId}-${Math.min(active, options.length - 1)}` : undefined}
          rows={1} value={value} placeholder="메시지를 입력하세요. @로 사람을 부를 수 있습니다."
          onChange={event => { setValue(event.target.value); track(event.target); }} onSelect={event => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={onKeyDown} onBlur={() => setDismissed(true)} onFocus={event => track(event.currentTarget)}
          className={cn('field-sizing-content max-h-40 min-h-10 min-w-0 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none',
            'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11 max-md:text-base')} />
        <Button size="icon" aria-label="보내기" title="보내기 (Enter)" className="size-10 shrink-0 rounded-full max-md:size-11" onClick={send}><ArrowUpIcon /></Button>
      </div>
    </div>
  );
}
