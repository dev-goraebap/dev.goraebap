import { useEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import { Button } from '@/shared/ui/kit/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/kit/dialog';
import { ClockIcon, RestoreIcon, SearchIcon, ShieldCheckIcon, SquareArrowOutUpRightIcon } from '@/shared/ui/kit/icon';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/ui/kit/input-group';
import { PageState } from '@/shared/ui/kit/page-state';
import type { VersionRecord } from './model';

const iconOf = (reason: VersionRecord['reason']) => reason === 'before-restore' ? ShieldCheckIcon : reason === 'restored' ? RestoreIcon : ClockIcon;
const when = (created: string) => new Date(created).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

/**
 * 남은 버전의 목록: 최근 것부터 앱의 목록 행(아이콘 · 시각 · 무엇이 남겼는지), 행 사이에만 구분선. 여섯 개를 넘으면 위에 검색 칸을 둔다.
 * 고르면 onSelect(부르는 쪽이 그 버전의 페이지로 간다). 다이얼로그와 버전 기록 페이지가 함께 쓴다.
 */
export function VersionList({ versions, selected, onSelect, listClassName }: {
  versions: VersionRecord[]; selected?: string; onSelect: (version: VersionRecord) => void;
  /** 목록만 감싸는 틀(페이지에서 테두리 상자로). 검색 칸은 그 밖에 둔다. */
  listClassName?: string;
}) {
  const [query, setQuery] = useState('');
  const filtered = versions.filter(version => `${version.label} ${when(version.created)}`.includes(query.trim()));
  return <div className="flex flex-col gap-3">
    {versions.length > 6 ? <InputGroup className="h-9 max-md:h-11">
      <InputGroupAddon><SearchIcon /></InputGroupAddon>
      <InputGroupInput type="search" aria-label="버전 검색" placeholder="날짜나 기록 검색" value={query} onChange={event => setQuery(event.target.value)} />
    </InputGroup> : null}
    {filtered.length === 0
      ? <PageState isCompact kind={query ? 'search' : 'empty'} title={query ? '일치하는 기록이 없습니다' : '아직 남은 버전이 없습니다'}
        description={query ? '다른 날짜나 이름으로 찾아보세요.' : '본문을 저장하면 여기에 남습니다.'} />
      : <div className={listClassName}><ul aria-label="저장된 버전" className="flex flex-col divide-y">
        {filtered.map(version => {
          const Icon = iconOf(version.reason);
          return <li key={version.id}>
            <button type="button" aria-current={selected === version.id || undefined} onClick={() => onSelect(version)}
              className={cn('flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-row-hover focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-12',
                selected === version.id && 'bg-pressed')}>
              <Icon className="size-4 shrink-0 text-icon-muted" />
              <span className="flex min-w-0 flex-1 flex-col">
                <time dateTime={version.created} className="tabular-nums">{when(version.created)}</time>
                {version.label ? <span className="truncate text-xs text-muted-foreground">{version.label}</span> : null}
              </span>
            </button>
          </li>;
        })}
      </ul></div>}
  </div>;
}

/**
 * 버전 기록 다이얼로그: 상세에서 연다(주소는 부르는 쪽이 정한다, useMaskedDialog: 같은 주소를 바로 열면 버전 기록 페이지). 고르면 그 버전의
 * 페이지로 간다.
 */
export function VersionHistoryDialog({ versions, onSelect, onClose, onExpand }: {
  versions: VersionRecord[]; onSelect: (version: VersionRecord) => void; onClose: () => void;
  /** 페이지로 열기: 버전 기록 페이지로. */
  onExpand?: () => void;
}) {
  const returnFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => () => { const element = returnFocus.current; queueMicrotask(() => { if (element?.isConnected) element.focus({ preventScroll: true }); }); }, []);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent finalFocus={false} className="max-h-[min(40rem,76dvh)]">
      <DialogHeader className="pr-16">
        <DialogTitle>버전 기록</DialogTitle>
        <DialogDescription>본문을 저장할 때마다 자동으로 남습니다.</DialogDescription>
        {onExpand ? <Button variant="ghost" size="icon-sm" aria-label="페이지로 열기" title="페이지로 열기" className="absolute top-2 right-10 text-icon-muted" onClick={onExpand}>
          <SquareArrowOutUpRightIcon />
        </Button> : null}
      </DialogHeader>
      <div className="-mx-4 min-h-0 overflow-y-auto px-4 pb-2"><VersionList versions={versions} onSelect={onSelect} /></div>
    </DialogContent>
  </Dialog>;
}
