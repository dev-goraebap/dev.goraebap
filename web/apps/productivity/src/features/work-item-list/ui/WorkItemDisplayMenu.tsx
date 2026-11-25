import { Button } from '@goraebap/ui-react/compact/button';
import { DisplayChoice, DisplayMenu } from '@/shared/ui/kit/display-menu';
import { ChartNoAxesColumnIcon, KanbanSquareIcon, ListIcon, TableIcon, type Icon } from '@/shared/ui/kit/icon';
import { LAYOUTS, type ViewLayout } from '@/shared/ui/views';
import type { Display, SortKey } from '../model/use-work-item-filters';

// The directions' words by what is sorted, as BIT's.
const DIRECTIONS: Record<SortKey['kind'], [desc: string, asc: string]> = {
  date: ['최신 → 오래된', '오래된 → 최신'],
  text: ['하 → 가', '가 → 하'],
  rank: ['높은 → 낮은', '낮은 → 높은'],
};

const LAYOUT_ICONS: Record<ViewLayout, Icon> = { list: ListIcon, table: TableIcon, kanban: KanbanSquareIcon, timeline: ChartNoAxesColumnIcon };

/**
 * The 표시 tool of a work item list: how the list is laid out (리스트 · 테이블 · 칸반 · 타임라인), then the sort key, its
 * direction in words that fit the key, and the grouping, each a row of pills, then 초기화 when it differs from the view's
 * own. The layout is this browser's until the view is saved, so it does not light the tool.
 */
export function WorkItemDisplayMenu({ sorts, groups, value, initial, onChange, layout }: {
  sorts: SortKey[]; groups: { id: string; label: string }[]; value: Display; initial: Display; onChange: (value: Display) => void;
  layout: { value: ViewLayout; onChange: (layout: ViewLayout) => void };
}) {
  const isTweaked = value.sort !== initial.sort || value.direction !== initial.direction || value.group !== initial.group;
  const kind = sorts.find(sort => sort.id === value.sort)?.kind ?? 'date';
  return <DisplayMenu isTweaked={isTweaked} onReset={() => onChange(initial)}>
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-muted-foreground">보기 방식</h3>
      <div role="group" aria-label="보기 방식" className="flex flex-wrap gap-1">
        {LAYOUTS.map(item => {
          const isCurrent = item.id === layout.value;
          const LayoutIcon = LAYOUT_ICONS[item.id];
          return <Button key={item.id} variant={isCurrent ? 'view-active' : 'view'} aria-pressed={isCurrent} className="px-3"
            onClick={() => layout.onChange(item.id)}>
            <LayoutIcon data-icon="inline-start" chosen={isCurrent} />
            {item.label}
          </Button>;
        })}
      </div>
    </section>
    <DisplayChoice title="정렬 기준" items={sorts.map(sort => ({ value: sort.id, label: sort.label }))} value={value.sort}
      onChange={sort => onChange({ ...value, sort })} />
    <DisplayChoice title="방향" items={[{ value: 'desc', label: DIRECTIONS[kind][0] }, { value: 'asc', label: DIRECTIONS[kind][1] }] as const}
      value={value.direction} onChange={direction => onChange({ ...value, direction })} />
    {groups.length ? <DisplayChoice title="그룹" items={groups.map(group => ({ value: group.id, label: group.label }))} value={value.group}
      onChange={group => onChange({ ...value, group })} /> : null}
  </DisplayMenu>;
}
