/**
 * [data-gb-toggle="<target-id>"] 트리거로 대상 영역을 접고 펼칩니다.
 */
export function initDisclosures(root: ParentNode = document): () => void {
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLElement>("[data-gb-toggle]").forEach((trigger) => {
    const targetId = trigger.getAttribute("data-gb-toggle");
    if (!targetId) return;
    const onClick = () => {
      const panel = document.getElementById(targetId);
      if (!panel) return;
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    };
    trigger.addEventListener("click", onClick);
    cleanups.push(() => trigger.removeEventListener("click", onClick));
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
