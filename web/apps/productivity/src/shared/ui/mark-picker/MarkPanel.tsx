import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from 'cn';
import { ColorPalette } from '../color-palette';
import { SearchIcon } from '../kit/icon';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../kit/input-group';
import { COMMON, loadedSolar, loadSolar, searchIcons } from './catalog';
import { markTone } from './Mark';
import { MarkIcon } from './MarkIcon';

/** What a mark is: an icon (the app's own name or `s:` and a Solar one; none draws the letter) and a colour (`#RRGGBB`). */
export type MarkValue = { icon: string | null; color: string | null };

/** How many icons the full set draws at first and adds as its end scrolls into sight: there are about 1,460. */
const PAGE = 240;

const cellClass = cn('grid aspect-square place-items-center rounded-md text-(--mark,var(--foreground)) outline-none',
  'hover:bg-accent focus-visible:bg-accent aria-pressed:bg-secondary aria-pressed:ring-1 aria-pressed:ring-border aria-pressed:ring-inset');

/**
 * The inside of the mark picker (BIT's IconPanel): a search across the top (an icon's English name or a common Korean
 * word), the palette's colours, then a grid of the common icons and every Solar icon, in the mark's colour; with a
 * letter, 글자 (no icon, the letter's first character) leads the common ones. The full set is fetched the first time the
 * picker opens. Arrow keys move through the grid, Down in the search steps into it and Enter there picks the first match.
 * isLarge is a phone's sheet: bigger cells, and the sheet scrolls rather than the grid.
 */
export function MarkPanel({ value, letter, isLarge, onPick, onColor }: {
  value: MarkValue; letter?: string; isLarge: boolean; onPick: (icon: string | null) => void; onColor: (color: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [icons, setIcons] = useState(loadedSolar);
  const grid = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (icons) return;
    let isLive = true;
    void loadSolar().then(all => { if (isLive) setIcons(all); });
    return () => { isLive = false; };
  }, [icons]);
  useEffect(() => { setLimit(PAGE); grid.current?.scrollTo({ top: 0 }); }, [query]);
  useEffect(() => {
    const sentinel = end.current;
    if (!sentinel) return;
    // On a desktop the grid scrolls under the search; in a phone's sheet the sheet does.
    const watch = new IntersectionObserver(seen => { if (seen.some(each => each.isIntersecting)) setLimit(count => count + PAGE); },
      { root: isLarge ? null : grid.current, rootMargin: '200px' });
    watch.observe(sentinel);
    return () => watch.disconnect();
  });

  const names = useMemo(() => (icons ? Object.keys(icons).sort() : []), [icons]);
  const found = useMemo(() => searchIcons(names, query).map(name => `s:${name}`), [names, query]);

  const cellsOf = () => [...(grid.current?.querySelectorAll<HTMLButtonElement>('button[data-cell]') ?? [])];
  const keys = (event: KeyboardEvent<HTMLElement>) => {
    const cells = cellsOf();
    const focused = document.activeElement as HTMLButtonElement;
    const at = cells.indexOf(focused);
    if (at < 0) return;
    // A row's cells share their top: the grid's columns are how many of the focused cell's own grid stand on its first row.
    const row = [...(focused.parentElement?.children ?? [])] as HTMLElement[];
    const columns = Math.max(1, row.filter(each => each.offsetTop === row[0]?.offsetTop).length);
    const step = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns } as Record<string, number>)[event.key];
    if (step === undefined) return;
    event.preventDefault();
    cells[Math.min(cells.length - 1, Math.max(0, at + step))]?.focus();
  };

  const tone = markTone(value.color);
  const cells = (children: ReactNode) => (
    <div className={cn('grid gap-0.5', isLarge ? 'grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] [&_svg]:size-5.5' : 'grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] [&_svg]:size-4.5')}>
      {children}
    </div>
  );
  // A cell is a mark's icon: an app icon's name, or `s:` and a Solar icon's.
  const cell = (icon: string) => {
    const title = icon.startsWith('s:') ? icon.slice(2) : icon;
    return (
      // check-ui: allow-style 표식의 색은 사용자가 고른 데이터다.
      <button key={icon} type="button" data-cell className={cellClass} aria-pressed={value.icon === icon} aria-label={title} title={title}
        tabIndex={value.icon === icon ? 0 : -1} style={tone} onClick={() => onPick(icon)}><MarkIcon name={icon} /></button>
    );
  };
  const letterCell = letter !== undefined && (
    <button type="button" data-cell className={cn(cellClass, 'text-sm font-bold text-muted-foreground')} aria-pressed={!value.icon}
      aria-label="아이콘 없이 글자" title="아이콘 없이 글자" tabIndex={!value.icon ? 0 : -1} onClick={() => onPick(null)}>{letter.slice(0, 1) || 'A'}</button>
  );
  const heading = (text: string) => <h3 className="px-0.5 pt-3 pb-1 text-xs font-medium text-muted-foreground first:pt-1">{text}</h3>;
  const note = (text: string) => <p className="px-2 py-6 text-center text-xs text-muted-foreground">{text}</p>;

  let body;
  if (query && !icons) body = note('불러오는 중입니다');
  else if (query) body = found.length ? cells(found.slice(0, limit).map(cell)) : note(`'${query}'에 맞는 아이콘이 없습니다`);
  else body = <>
    {heading('자주 쓰는 아이콘')}
    {cells(<>{letterCell}{COMMON.map(cell)}</>)}
    {icons ? <>
      {heading(`모든 아이콘 ${names.length.toLocaleString()}개`)}
      {cells(names.slice(0, limit).map(name => cell(`s:${name}`)))}
    </> : note('모든 아이콘을 불러오는 중입니다')}
  </>;

  const firstPressed = () => grid.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]') ?? cellsOf()[0];
  return (
    <div className={cn('flex min-h-0 flex-col gap-2', isLarge && 'h-full')}>
      <InputGroup>
        <InputGroupAddon><SearchIcon /></InputGroupAddon>
        <InputGroupInput type="search" aria-label="아이콘 찾기" placeholder="아이콘 찾기 (예: 달력, rocket)" autoFocus={!isLarge} value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') { const first = query ? found[0] : COMMON[0]; if (first) onPick(first); }
            if (event.key === 'ArrowDown') { event.preventDefault(); firstPressed()?.focus(); }
          }} />
      </InputGroup>
      <ColorPalette value={value.color} onChange={onColor} />
      <div ref={grid} role="group" aria-label="아이콘" onKeyDown={keys}
        className={cn('overscroll-contain', isLarge ? 'overflow-visible' : 'max-h-80 overflow-y-auto')}>
        {body}
        <div ref={end} className="h-px shrink-0" />
      </div>
    </div>
  );
}
