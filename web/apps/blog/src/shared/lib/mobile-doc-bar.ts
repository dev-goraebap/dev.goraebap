import { useEffect, useRef, useSyncExternalStore } from "react";
import type { TocItem } from "@/shared/ui/TableOfContents";

export interface MobileSidebarRegistration {
  label: string;
  open: () => void;
}

export interface MobileDocBarState {
  sidebar: MobileSidebarRegistration | null;
  toc: readonly TocItem[];
}

const EMPTY_TOC: readonly TocItem[] = [];
const SERVER_SNAPSHOT: MobileDocBarState = { sidebar: null, toc: EMPTY_TOC };

let state: MobileDocBarState = SERVER_SNAPSHOT;
let sidebarOwner: symbol | null = null;
let tocOwner: symbol | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): MobileDocBarState {
  return state;
}

function getServerSnapshot(): MobileDocBarState {
  return SERVER_SNAPSHOT;
}

function sameToc(a: readonly TocItem[], b: readonly TocItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].text !== b[i].text || a[i].level !== b[i].level) return false;
  }
  return true;
}

export function useMobileDocBarState(): MobileDocBarState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useRegisterMobileSidebar(label: string, open: () => void) {
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const token = Symbol("mobile-sidebar");
    sidebarOwner = token;
    state = {
      ...state,
      sidebar: {
        label,
        open: () => openRef.current(),
      },
    };
    emit();

    return () => {
      if (sidebarOwner !== token) return;
      sidebarOwner = null;
      state = { ...state, sidebar: null };
      emit();
    };
  }, [label]);
}

export function useRegisterMobileToc(items: readonly TocItem[]) {
  const key = items.map((item) => `${item.level}:${item.id}:${item.text}`).join("\n");
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  });

  useEffect(() => {
    const token = Symbol("mobile-toc");
    tocOwner = token;
    const current = itemsRef.current;
    const next = current.length > 0 ? current : EMPTY_TOC;
    if (!sameToc(state.toc, next)) {
      state = { ...state, toc: next };
      emit();
    }

    return () => {
      if (tocOwner !== token) return;
      tocOwner = null;
      if (state.toc.length > 0) {
        state = { ...state, toc: EMPTY_TOC };
        emit();
      }
    };
  }, [key]);
}
