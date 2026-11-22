/**
 * [data-gb-tabs] 컨테이너에 탭 전환과 화살표 키보드 이동(Roving Focus)을 연결합니다.
 * - 탭 버튼: [role="tab"][data-gb-tab="<value>"]
 * - 패널:    [role="tabpanel"][data-gb-panel="<value>"]
 */
export function initTabs(root: ParentNode = document): () => void {
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLElement>("[data-gb-tabs]").forEach((container) => {
    const tabs = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"][data-gb-tab]'));
    const panels = Array.from(
      container.querySelectorAll<HTMLElement>('[role="tabpanel"][data-gb-panel]'),
    );
    if (tabs.length === 0) return;

    const activate = (value: string, focusTab = false) => {
      tabs.forEach((tab) => {
        const active = tab.getAttribute("data-gb-tab") === value;
        tab.setAttribute("aria-selected", String(active));
        tab.setAttribute("tabindex", active ? "0" : "-1");
        if (active) {
          tab.setAttribute("data-active", "");
          if (focusTab) tab.focus();
        } else {
          tab.removeAttribute("data-active");
        }
      });
      panels.forEach((panel) => {
        const active = panel.getAttribute("data-gb-panel") === value;
        panel.hidden = !active;
      });
    };

    const initial =
      tabs.find((t) => t.getAttribute("aria-selected") === "true")?.getAttribute("data-gb-tab") ??
      tabs[0].getAttribute("data-gb-tab");
    if (initial) activate(initial);

    tabs.forEach((tab, index) => {
      const onClick = () => {
        const val = tab.getAttribute("data-gb-tab");
        if (val) activate(val);
      };
      const onKeyDown = (event: KeyboardEvent) => {
        let nextIndex: number | null = null;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        const val = tabs[nextIndex]?.getAttribute("data-gb-tab");
        if (val) activate(val, true);
      };
      tab.addEventListener("click", onClick);
      tab.addEventListener("keydown", onKeyDown);
      cleanups.push(() => {
        tab.removeEventListener("click", onClick);
        tab.removeEventListener("keydown", onKeyDown);
      });
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
