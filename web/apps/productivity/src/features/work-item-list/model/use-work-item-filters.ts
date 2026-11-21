import { useState } from 'react';
import type { FilterDef, Filters } from '@/shared/ui/kit/filter';

/** The values chosen, by filter key; a key with none is not in force. */
export type FilterState = Record<string, string[]>;
/** What 표시 orders and groups by: the sort key, its direction and the grouping (the server's names). */
export type Display = { sort: string; direction: 'desc' | 'asc'; group: string };
/** An order 표시 offers, and what kind of thing it sorts (it picks the directions' words). */
export type SortKey = { id: string; label: string; kind: 'date' | 'text' | 'rank' };
/** A filter of the work items: its name and icon, and the values it takes (several at once). */
export type WorkItemFilterDef = FilterDef<string>;

/** What a list shows under its view: the filters' values by key and the display (sort, direction, grouping). */
export type WorkItemQuery = { state: FilterState; display: Display };

const shownOf = (state: FilterState) => Object.keys(state).filter(key => (state[key] ?? []).length > 0);

/**
 * A work item list's filters and display as BIT keeps them: the values by filter, the chips shown on a desktop (in force,
 * or just added and still empty), the filter menu (open, and at which filter; a bottom sheet on a phone), and the display.
 * The values live in the address (the page's onQueryChange), so a reload or a shared link shows the same list. reset puts
 * them back to a view's own.
 */
export function useWorkItemFilters(initial: WorkItemQuery, onQueryChange?: (query: WorkItemQuery) => void) {
  const [own, setOwn] = useState(initial);
  const query = onQueryChange ? initial : own;
  const update = onQueryChange ?? setOwn;
  const state = query.state;
  const [shown, setShown] = useState<string[]>(() => shownOf(initial.state));
  const [menu, setMenu] = useState<{ isOpen: boolean; step?: string }>({ isOpen: false });
  const display = query.display;
  const setState = (state: FilterState) => update({ ...query, state });
  const setDisplay = (display: Display) => update({ ...query, display });
  const show = (key: string) => setShown(current => (current.includes(key) ? current : [...current, key]));
  const change = (key: string, values: string[]) => {
    setState({ ...state, [key]: values });
    if (values.length > 0) show(key);
  };
  return {
    state, shown: [...new Set([...shown, ...shownOf(state)])], menu, setMenu, display, setDisplay, change, show, setShown,
    remove: (key: string) => { change(key, []); setShown(current => current.filter(each => each !== key)); },
    clear: () => { setState({}); setShown([]); },
    reset: (to: WorkItemQuery) => { setShown(shownOf(to.state)); update(to); },
  };
}
export type WorkItemFilters = ReturnType<typeof useWorkItemFilters>;

/** The filters as the kit's filter bar, chips and menu read them (useFilters' shape), over the list's own state. */
export function kitFiltersOf(filters: WorkItemFilters, defs: readonly WorkItemFilterDef[]): Filters<string> {
  const defOf = (key: string) => defs.find(def => def.key === key)!;
  const has = (key: string) => defs.some(def => def.key === key);
  const active = defs.filter(def => (filters.state[def.key]?.length ?? 0) > 0).map(def => def.key);
  return {
    defs, state: filters.state, shown: filters.shown.filter(has), menu: filters.menu, setMenu: filters.setMenu,
    change: filters.change, show: filters.show, defOf, active,
    chosenNames: (key: string) => {
      const names = (filters.state[key] ?? []).map(value => defOf(key).options.find(option => option.value === value)?.label ?? value);
      return { shown: names.slice(0, 2).join(', '), more: Math.max(0, names.length - 2) };
    },
    remove: filters.remove, clear: filters.clear,
  };
}
