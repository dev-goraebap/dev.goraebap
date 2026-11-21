import { useState } from 'react';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { FilterBar, FilterChips, FilterMenu, useFilters as useKitFilters, type FilterDef, type FilterState } from '@/shared/ui/kit/filter';

/**
 * A page's filters as the kit keeps them (shared/ui/filter): the values by filter, each holding one value at most (the one
 * just picked replaces the one before), the chips shown on a desktop or a phone; and the tool and what is in force for the
 * page's toolbar.
 */
export function useFilters<K extends string>(defs: readonly FilterDef<K>[]) {
  const isPhone = useIsMobile();
  const [state, setState] = useState<FilterState<K>>({});
  const filters = useKitFilters(defs, {
    state,
    onStateChange: next => setState(Object.fromEntries(Object.entries(next).map(([key, values]) => [key, (values as string[]).slice(-1)])) as FilterState<K>),
  });
  const tools = <FilterMenu filters={filters} />;
  const applied = isPhone ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />;
  /** The one value a filter holds. */
  const one = (key: K) => state[key]?.[0];
  return { state, one, count: filters.active.length, clear: filters.clear, tools, applied };
}
