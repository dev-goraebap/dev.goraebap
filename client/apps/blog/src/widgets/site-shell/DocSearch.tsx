import { useRouter } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { searchEntries } from '@/entities/document';
import { Button } from '@/shared/ui/button';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command';
import { SearchIcon } from '@/shared/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

/** 묶음 이름 순서대로 모은 찾기 목록. 묶음이 없는 글(블로그)은 'Blog'로 온다. */
const grouped = () => {
  const groups = new Map<string, typeof searchEntries>();
  for (const entry of searchEntries) groups.set(entry.group || '문서', [...(groups.get(entry.group || '문서') ?? []), entry]);
  return [...groups];
};

/**
 * 문서 찾기: 문서 제목 · 묶음 · 설명으로 고른다. 사이드바 머리(휴대폰은 앱 바)의 돋보기나 Ctrl+K(맥 ⌘K)로 연다.
 * 고르면 그 문서로 옮기고 닫는다. 찾는 말은 열 때마다 비운다.
 */
export function DocSearch({ size = 'icon-sm' }: { size?: 'icon-sm' | 'icon' }) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const groups = useMemo(grouped, []);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
  const go = (path: string) => { setOpen(false); void router.navigate({ href: path }); };
  return <>
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size={size} aria-label="문서 찾기" className="max-md:size-11" onClick={() => setOpen(true)} />}>
        <SearchIcon />
      </TooltipTrigger>
      <TooltipContent>문서 찾기 (Ctrl K)</TooltipContent>
    </Tooltip>
    <CommandDialog open={isOpen} onOpenChange={setOpen} title="문서 찾기" description="제목 · 묶음 · 설명으로 문서를 찾습니다.">
      <Command>
        <CommandInput placeholder="문서 제목 · 묶음 · 설명" />
        <CommandList className="max-h-[min(24rem,60vh)]">
          <CommandEmpty>맞는 문서가 없습니다.</CommandEmpty>
          {groups.map(([group, entries]) => <CommandGroup key={group} heading={group}>
            {entries.map(entry => <CommandItem key={entry.id} value={entry.id} keywords={[entry.label, group, entry.description ?? '']} onSelect={() => go(entry.id)}>
              <span className="truncate">{entry.label}</span>
            </CommandItem>)}
          </CommandGroup>)}
        </CommandList>
      </Command>
    </CommandDialog>
  </>;
}
