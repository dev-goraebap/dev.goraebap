import { Command as CommandPrimitive } from 'cmdk';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/kit/button';
import { Command, CommandDialog, CommandGroup, CommandItem, CommandList, CommandShortcut } from '@/shared/ui/kit/command';
import { ArrowLeftIcon, ClockIcon, SearchIcon, SquareArrowOutUpRightIcon, Trash2Icon, XIcon, type Icon } from '@/shared/ui/kit/icon';
import { Page, useFullScreen, type Crumb } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { Spinner } from '@/shared/ui/kit/spinner';
import { useRecentSearches, useSearch, useSettled, type SearchHit, type SearchSource } from '../model/search';

/** A row of the list: a hit to go to, or a search made before to ask again. */
type Row = { key: string; label: string; where?: string; icon: Icon; media?: ReactNode; onPick: () => void; end?: ReactNode };
type Group = { title: string; rows: Row[]; action?: ReactNode };

/**
 * 검색 over everything (Linear's command menu, client/'s 통합 검색): the words on top, what they find under them, grouped
 * by where it was found (sources: 메뉴, and the server's 업무 · 문서 · 회의록 · 일정 · 공지 · 주간보고). Typing settles before a search
 * runs (200ms), the last hits staying while the next are found. Before anything is typed it offers the searches made
 * before (this browser's) and the places most gone to (shortcuts). ↑ ↓ choose, Enter goes, Esc shuts (cmdk); what was
 * found by a search is remembered with its words. A dialog near the top of the screen on a desktop (surface dialog, over
 * the page it was opened from), a page of its own on a phone: ← then the search box in the app bar's place, no tab bar.
 */
export function GlobalSearch({ surface, crumbs = [{ label: '검색', icon: SearchIcon }], sources, shortcuts, onGo, onClose, onExpand }: {
  surface: 'dialog' | 'page'; crumbs?: Crumb[]; sources: readonly SearchSource[]; shortcuts: readonly SearchHit[];
  onGo: (href: string) => void; onClose: () => void; onExpand?: () => void;
}) {
  const isMobile = useIsMobile();
  useFullScreen(isMobile);
  const [words, setWords] = useState('');
  const settled = useSettled(words);
  const search = useSearch(sources, settled);
  const recent = useRecentSearches();
  const input = useRef<HTMLInputElement>(null);
  const isAsking = !!words.trim();
  const isPending = isAsking && (settled !== words || search.isPending);
  const isEmpty = isAsking && !isPending && search.groups.length === 0;
  const go = (hit: SearchHit) => { if (isAsking) recent.add(words); onGo(hit.href); };
  const ask = (each: string) => { setWords(each); input.current?.focus(); };
  const hitRow = (hit: SearchHit): Row => ({ key: hit.id, label: hit.label, where: hit.where, icon: hit.icon, media: hit.media, onPick: () => go(hit) });

  // What the list shows: the hits for the words, or, before any, the searches made before and the shortcuts.
  const groups: Group[] = isAsking
    ? search.groups.map(group => ({ title: group.source.title, rows: group.hits.map(hitRow) }))
    : [
      ...(recent.recent.length ? [{
        title: '최근 검색',
        action: <Button variant="ghost" size="icon-xs" aria-label="최근 검색 모두 지우기" title="모두 지우기" onClick={recent.clear}><Trash2Icon /></Button>,
        rows: recent.recent.map(each => ({
          key: `recent:${each}`, label: each, icon: ClockIcon, onPick: () => ask(each),
          end: (
            <Button variant="ghost" size="icon-xs" aria-label={`${each} 지우기`} title="지우기"
              onClick={event => { event.stopPropagation(); recent.remove(each); }}>
              <XIcon />
            </Button>
          ),
        })),
      }] : []),
      { title: '바로 가기', rows: shortcuts.map(hitRow) },
    ];

  // A new list starts at its first row (cmdk remembers the chosen row by its value).
  const first = groups[0]?.rows[0]?.key ?? '';
  const [active, setActive] = useState(first);
  useEffect(() => setActive(first), [first]);

  const field = (
    <div className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
      <SearchIcon className="shrink-0" />
      <CommandPrimitive.Input ref={input} value={words} onValueChange={setWords} autoFocus aria-label="검색어" placeholder="메뉴 · 업무 · 문서 찾기"
        className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
      {isPending ? <Spinner aria-label="찾는 중" /> : null}
      {words ? (
        <Button variant="ghost" size="icon-sm" aria-label="검색어 지우기" title="지우기" className="max-md:size-11" onClick={() => ask('')}>
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
  const list = (
    <CommandList className="max-h-none min-h-0 flex-1 px-2 py-3">
      {isEmpty ? (
        <PageState kind="search" isCompact title={`'${words.trim()}'에 맞는 결과가 없습니다`} />
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(group => (
            <section key={group.title} aria-label={group.title} className="flex flex-col gap-1">
              <header className="flex h-7 items-center justify-between px-2 text-xs font-medium text-muted-foreground">
                {group.title}
                {group.action}
              </header>
              <CommandGroup className="p-0">
                {group.rows.map(row => (
                  <CommandItem key={row.key} value={row.key} onSelect={row.onPick} className="gap-2.5 max-md:min-h-12 max-md:text-base">
                    {row.media ?? <row.icon chosen={row.key === active} />}
                    <span className="truncate">{row.label}</span>
                    {row.end ?? row.where ? <CommandShortcut className="shrink-0 tracking-normal">{row.end ?? row.where}</CommandShortcut> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </section>
          ))}
        </div>
      )}
    </CommandList>
  );
  const command = (children: ReactNode) => (
    <Command shouldFilter={false} loop value={active} onValueChange={setActive} className="min-h-0 flex-1 bg-transparent p-0">
      {children}
    </Command>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        {command(<>
          <header className="flex min-h-15 shrink-0 items-center gap-1 border-b px-2 py-2">
            <Button variant="ghost" size="icon" aria-label="뒤로" className="size-11" onClick={onClose}><ArrowLeftIcon /></Button>
            {field}
          </header>
          {list}
        </>)}
      </div>
    );
  }
  if (surface === 'page') {
    return (
      <Page crumbs={crumbs}>
        {command(<>
          <div className="flex h-13 shrink-0 items-center border-b bg-background pr-2 pl-4">{field}</div>
          <div className="flex min-h-0 flex-1 flex-col bg-background">{list}</div>
        </>)}
      </Page>
    );
  }
  return (
    // 열면 늘 검색 칸에 초점(대화상자가 첫 단추로 가져가지 않게).
    <CommandDialog open onOpenChange={isOpen => { if (!isOpen) onClose(); }} title="탐색" initialFocus={input}
      className="flex flex-col gap-0">
      {command(<>
        <div className="flex h-14 shrink-0 items-center gap-1 pr-3 pl-5">
          {field}
          {onExpand ? <Button variant="ghost" size="icon-sm" aria-label="페이지로 열기" title="페이지로 열기" onClick={onExpand}><SquareArrowOutUpRightIcon /></Button> : null}
        </div>
        {list}
        <footer className="flex h-11 shrink-0 items-center gap-3 px-5 text-xs text-muted-foreground">
          <span>↑ ↓ 고르기</span>
          <span>Enter 열기</span>
          <span>Esc 닫기</span>
        </footer>
      </>)}
    </CommandDialog>
  );
}
