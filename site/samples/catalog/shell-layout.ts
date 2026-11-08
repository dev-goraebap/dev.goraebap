import { useSyncExternalStore } from 'react';
import type { ShellLayout } from '@/shared/ui/layouts/app/AppFrame';

/** 가이드가 고른 셸 배치를 저장하는 키. 가이드 머리 줄의 배치 전환이 쓰고, 견본이 읽는다. */
import { SHELL_LAYOUT_KEY } from '@/shared/ui/layouts/app/shell-layout-key';
export { SHELL_LAYOUT_KEY };

/** 가이드 안에서는 바깥 문서의 data-shell-layout을, 새 창에서는 저장한 선택을 따른다. 없으면 inset. */
function read(): ShellLayout {
  try {
    const outer = window.parent !== window ? window.parent.document.documentElement.dataset.shellLayout : undefined;
    if (outer === 'inset' || outer === 'split') return outer;
    const stored = localStorage.getItem(SHELL_LAYOUT_KEY);
    if (stored === 'inset' || stored === 'split') return stored;
  } catch { /* 다른 출처이거나 저장소를 쓸 수 없으면 기본 배치 */ }
  return 'inset';
}

function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener);
  try {
    if (window.parent !== window) observer.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['data-shell-layout'] });
  } catch { /* 같은 출처가 아니면 건너뛴다. */ }
  window.addEventListener('storage', listener);
  return () => { observer.disconnect(); window.removeEventListener('storage', listener); };
}

/**
 * 견본 앱의 셸 배치(Inset·Split). 배치마다 견본을 따로 두지 않고 가이드 머리 줄의 전환 하나로 모든 견본이 같은 배치로
 * 바뀐다. 견본 앱은 AppFrame의 layout에 이 값을 넘긴다.
 */
export function useShellLayout(): ShellLayout {
  return useSyncExternalStore(subscribe, read, () => 'inset');
}
