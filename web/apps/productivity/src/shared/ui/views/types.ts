/** How a view lays its items out. */
export type ViewLayout = 'list' | 'table' | 'kanban' | 'timeline';

/**
 * A saved view, as BIT's: its name and icon in the toolbar's pills, how it lays items out, and whether only I see it. icon is
 * a mark's (solarIcon's meaning name, or `s:` and any Solar icon's); color is its mark colour, `#RRGGBB` from the palette,
 * picked with the icon in the view editor; a view with none draws its icon in the icon colour.
 */
export type SavedView = { id: string; label: string; icon: string; color?: string; layout: ViewLayout; isPrivate?: boolean };

/** What the view editor asks for. */
export type ViewDraft = Omit<SavedView, 'id'>;

export const LAYOUTS: { id: ViewLayout; label: string; icon: string }[] = [
  { id: 'list', label: '리스트', icon: 'layout-list' },
  { id: 'table', label: '테이블', icon: 'layout-table' },
  { id: 'kanban', label: '칸반', icon: 'layout-board' },
  { id: 'timeline', label: '타임라인', icon: 'layout-timeline' },
];

