import { initDialogs } from "./dom/dialog";
import { initDisclosures } from "./dom/disclosure";
import { initTabs } from "./dom/tabs";

export { initDialogs } from "./dom/dialog";
export { initDisclosures } from "./dom/disclosure";
export { initTabs } from "./dom/tabs";
export { applyColorMode, applyTheme, type ColorMode, type ThemeName } from "./dom/theme";

/**
 * Vanilla HTML/TS 페이지에서 data-gb-* 속성을 쓰는 기본 상호작용을 한 번에 연결합니다.
 */
export function initGoraebapUI(root: ParentNode = document): () => void {
  const stopDialogs = initDialogs(root);
  const stopTabs = initTabs(root);
  const stopDisclosures = initDisclosures(root);
  return () => {
    stopDialogs();
    stopTabs();
    stopDisclosures();
  };
}
