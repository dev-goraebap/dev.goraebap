import { cn } from 'cn';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from '@/shared/ui/kit/icon';
import { TableHead } from '@goraebap/ui-react/compact/table';

export type SortDirection = 'asc' | 'desc';

/**
 * 표 머리 칸 하나로 정렬한다(Linear의 표처럼, 데스크톱 표에는 따로 정렬 메뉴를 두지 않는다). 지금 정렬된 칸은 이름 뒤에 방향
 * 화살표(↑ 오름 · ↓ 내림), 다른 칸은 가리킬 때만 ⇅가 보인다. 지금 칸을 누르면 방향이 바뀌고, 다른 칸을 누르면 그 칸의 첫 방향
 * (firstDirection: 날짜는 최신부터 desc, 이름은 가나다 asc)으로 정렬한다. 화면 읽기 프로그램에는 aria-sort로 알린다.
 */
export function SortableHead<K extends string>({ label, sortKey, sort, direction, firstDirection = 'asc', onSort, align = 'left', className }: {
  label: string
  sortKey: K
  /** 지금 정렬 기준과 방향. */
  sort: K
  direction: SortDirection
  firstDirection?: SortDirection
  onSort: (sort: K, direction: SortDirection) => void
  align?: 'left' | 'right'
  className?: string
}) {
  const isCurrent = sort === sortKey;
  const Arrow = !isCurrent ? ArrowUpDownIcon : direction === 'asc' ? ArrowUpIcon : ArrowDownIcon;
  const next: SortDirection = isCurrent ? (direction === 'asc' ? 'desc' : 'asc') : firstDirection;
  return (
    <TableHead aria-sort={isCurrent ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={cn('text-muted-foreground', align === 'right' && 'text-right', className)}>
      <button type="button" onClick={() => onSort(sortKey, next)}
        aria-label={`${label}, ${next === 'asc' ? '오름차순' : '내림차순'}으로 정렬`}
        className={cn('group/sort inline-flex h-7 items-center gap-1 rounded-md px-1 -mx-1 font-medium outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
          isCurrent && 'text-foreground', align === 'right' && 'flex-row-reverse')}>
        {label}
        <Arrow aria-hidden className={cn('size-3.5 shrink-0', !isCurrent && 'opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60')} />
      </button>
    </TableHead>
  );
}
