import type { ReactNode } from 'react';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { FilterBar, FilterChips, FilterMenu } from '@/shared/ui/kit/filter';
import type { ViewLayout } from '@/shared/ui/views';
import { WorkItemDisplayMenu } from '../ui/WorkItemDisplayMenu';
import { kitFiltersOf, type Display, type SortKey, type WorkItemFilterDef, type WorkItemFilters } from './use-work-item-filters';

/**
 * A work item list's tools and what is in force, as BIT lays them: 필터 (a two-step menu, a bottom sheet on a phone) and
 * 표시, then whatever trails them (뷰에 저장). Under the toolbar a desktop has the row of filter chips (each opens its
 * values, + adds one), a phone a scrolling row of chips that opens the sheet at its filter.
 */
export function useWorkItemTools({ filters, list, sorts, groups, initial, trailing, layout }: {
  filters: WorkItemFilters; list: WorkItemFilterDef[]; sorts: SortKey[]; groups: { id: string; label: string }[]; initial: Display; trailing?: ReactNode;
  /** How the list is laid out now (리스트 · 테이블 · 칸반 · 타임라인), chosen in 표시. */
  layout: { value: ViewLayout; onChange: (layout: ViewLayout) => void };
}): { tools: ReactNode; applied?: ReactNode } {
  const isMobile = useIsMobile();
  const kit = kitFiltersOf(filters, list);
  return {
    tools: <>
      <FilterMenu filters={kit} />
      <WorkItemDisplayMenu sorts={sorts} groups={groups} value={filters.display} initial={initial} onChange={filters.setDisplay} layout={layout} />
      {trailing}
    </>,
    applied: isMobile ? <FilterChips filters={kit} /> : <FilterBar filters={kit} />,
  };
}
