import { useSyncExternalStore, type PropsWithChildren } from "react";
import {
  DocsContainer,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks";
import { addons } from "storybook/preview-api";
import {
  GLOBALS_UPDATED,
  SET_GLOBALS,
  UPDATE_GLOBALS,
} from "storybook/internal/core-events";
import {
  catalogMode,
  catalogThemes,
  initialCatalogMode,
} from "./catalog-theme";

// 전역 값 변경 때 Docs가 다시 마운트되어도 최신 선택을 유지한다.
let mode = initialCatalogMode();
const listeners = new Set<() => void>();
const channel = addons.getChannel();
function update({ globals }: { globals: Record<string, unknown> }) {
  if (!("theme" in globals)) return;
  const next = catalogMode(globals.theme);
  if (next === mode) return;
  mode = next;
  listeners.forEach((listener) => listener());
}
const events = [UPDATE_GLOBALS, GLOBALS_UPDATED, SET_GLOBALS];
events.forEach((event) => channel.on(event, update));
if (import.meta.hot)
  import.meta.hot.dispose(() =>
    events.forEach((event) => channel.off(event, update)),
  );
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function ThemedDocsContainer({
  context,
  children,
}: PropsWithChildren<DocsContainerProps>) {
  const current = useSyncExternalStore(subscribe, () => mode);
  return (
    <DocsContainer context={context} theme={catalogThemes[current]}>
      {children}
    </DocsContainer>
  );
}
