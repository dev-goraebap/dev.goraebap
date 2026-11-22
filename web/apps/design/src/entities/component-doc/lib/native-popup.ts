import { useEffect, useId, useRef, type KeyboardEvent } from "react";

const VIEWPORT_EDGE = 8;

interface PopupPlacement {
  side?: "top" | "bottom";
  align?: "start" | "center";
  sideOffset?: number;
  focusFirstItem?: boolean;
}

const MENU_ITEMS = '[role="menuitem"]:not([aria-disabled="true"])';

function placePopup(
  popup: HTMLElement,
  anchor: DOMRect,
  { side = "bottom", align = "center", sideOffset = 6 }: PopupPlacement,
) {
  const width = popup.offsetWidth;
  const height = popup.offsetHeight;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  const below = anchor.bottom + sideOffset;
  const above = anchor.top - sideOffset - height;
  const fitsBelow = below + height <= viewportHeight - VIEWPORT_EDGE;
  const fitsAbove = above >= VIEWPORT_EDGE;
  const top =
    side === "bottom"
      ? fitsBelow || !fitsAbove
        ? below
        : above
      : fitsAbove || !fitsBelow
        ? above
        : below;
  const preferredLeft =
    align === "start" ? anchor.left : anchor.left + anchor.width / 2 - width / 2;
  const left = Math.max(
    VIEWPORT_EDGE,
    Math.min(preferredLeft, viewportWidth - width - VIEWPORT_EDGE),
  );
  popup.style.inset = "auto";
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

export function useNativePopup<T extends HTMLElement = HTMLButtonElement>({
  side,
  align,
  sideOffset,
  focusFirstItem,
}: PopupPlacement = {}) {
  const popupId = useId();
  const triggerRef = useRef<T>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const pointRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;

    const place = () => {
      if (!popup.matches(":popover-open")) return;
      const anchor = pointRef.current ?? triggerRef.current?.getBoundingClientRect();
      if (anchor) placePopup(popup, anchor, { side, align, sideOffset });
    };
    const handleToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      triggerRef.current?.toggleAttribute("data-popup-open", isOpen);
      triggerRef.current?.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        place();
        if (focusFirstItem) {
          popup.querySelector<HTMLElement>(MENU_ITEMS)?.focus({ preventScroll: true });
        }
      } else {
        pointRef.current = null;
      }
    };

    popup.addEventListener("toggle", handleToggle);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      popup.removeEventListener("toggle", handleToggle);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [side, align, sideOffset, focusFirstItem]);

  function open() {
    const popup = popupRef.current;
    if (popup && !popup.matches(":popover-open")) popup.showPopover();
  }

  function openAt(x: number, y: number) {
    pointRef.current = new DOMRect(x, y, 0, 0);
    const popup = popupRef.current;
    if (!popup) return;
    if (popup.matches(":popover-open"))
      placePopup(popup, pointRef.current, { side, align, sideOffset });
    else popup.showPopover();
  }

  function close() {
    const popup = popupRef.current;
    if (popup?.matches(":popover-open")) popup.hidePopover();
  }

  return { popupId, triggerRef, popupRef, open, openAt, close };
}

export function handleMenuKeys(event: KeyboardEvent<HTMLElement>) {
  if (event.key === "Tab") {
    event.currentTarget.hidePopover();
    return;
  }
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(MENU_ITEMS)];
  if (items.length === 0) return;
  const index = items.indexOf(document.activeElement as HTMLElement);
  const nextIndex = {
    ArrowDown: (index + 1) % items.length,
    ArrowUp: (index - 1 + items.length) % items.length,
    Home: 0,
    End: items.length - 1,
  }[event.key];
  if (nextIndex === undefined) return;
  event.preventDefault();
  items[nextIndex].focus();
}
