/**
 * Lifts a floating part of the editor (the block menu, the table tools, a palette, the comments) into the browser's top
 * layer as a manual popover once it is drawn, so it stands over a modal dialog the editor is written in (cowork's new
 * work item): drawn into the page's body, it would sit under the dialog, which is in the top layer itself.
 */
export function topLayer(element: HTMLElement | null) {
  if (!element || typeof element.showPopover !== 'function' || element.matches(':popover-open')) return;
  element.popover = 'manual';
  element.showPopover();
}
