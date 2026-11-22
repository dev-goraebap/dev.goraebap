/**
 * 네이티브 <dialog> 요소에 열기/닫기/배경 클릭 닫기 동작을 연결합니다.
 * - 열기 버튼: data-gb-dialog-open="<dialog-id>"
 * - 닫기 버튼: data-gb-dialog-close (가장 가까운 <dialog>를 닫음)
 * - 배경 클릭 방지: <dialog data-gb-dialog-static>
 */
export function initDialogs(root: ParentNode = document): () => void {
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLElement>("[data-gb-dialog-open]").forEach((trigger) => {
    const targetId = trigger.getAttribute("data-gb-dialog-open");
    if (!targetId) return;
    const onClick = () => {
      const dialog = document.getElementById(targetId);
      if (dialog instanceof HTMLDialogElement && !dialog.open) {
        dialog.showModal();
      }
    };
    trigger.addEventListener("click", onClick);
    cleanups.push(() => trigger.removeEventListener("click", onClick));
  });

  root.querySelectorAll<HTMLElement>("[data-gb-dialog-close]").forEach((button) => {
    const onClick = () => {
      const dialog = button.closest("dialog");
      if (dialog instanceof HTMLDialogElement && dialog.open) {
        dialog.close();
      }
    };
    button.addEventListener("click", onClick);
    cleanups.push(() => button.removeEventListener("click", onClick));
  });

  root.querySelectorAll<HTMLDialogElement>("dialog:not([data-gb-dialog-static])").forEach((dialog) => {
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) {
        dialog.close();
      }
    };
    dialog.addEventListener("click", onClick);
    cleanups.push(() => dialog.removeEventListener("click", onClick));
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
