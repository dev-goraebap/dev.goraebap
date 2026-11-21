import { MarkIcon, markTone } from '../mark-picker';

/**
 * A view's mark beside its name: its icon in its colour (a view with none in the icon colour), Bold Duotone while in view.
 * The colour is data, the one picked.
 */
export function ViewMark({ view, isCurrent = false }: { view: { icon: string; color?: string | null }; isCurrent?: boolean }) {
  // check-ui: allow-style 뷰 표식의 색은 사용자가 고른 데이터다.
  return <span aria-hidden style={markTone(view.color)} className="inline-grid shrink-0 place-items-center text-(--mark,var(--icon-muted))">
    <MarkIcon name={view.icon} isChosen={isCurrent} className="size-4" />
  </span>;
}
