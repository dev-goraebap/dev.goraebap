import { useLayoutEffect, type RefObject } from "react";

const MOTION: KeyframeAnimationOptions = { duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" };

// height: auto에는 CSS transition이 걸리지 않으므로 바뀐 높이를 재서 앞 높이부터 움직인다.
export function useHeightTransition(ref: RefObject<HTMLElement | null>, enabled = true) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let last = element.offsetHeight;
    let motion: Animation | undefined;

    const observer = new ResizeObserver(() => {
      if (motion) return;
      const next = element.offsetHeight;
      if (Math.abs(next - last) <= 1 || reduced.matches) {
        last = next;
        return;
      }
      motion = element.animate(
        [
          { height: `${last}px`, overflow: "hidden" },
          { height: `${next}px`, overflow: "hidden" },
        ],
        MOTION,
      );
      const settle = () => {
        motion = undefined;
        last = element.offsetHeight;
      };
      motion.onfinish = settle;
      motion.oncancel = settle;
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      motion?.cancel();
    };
  }, [ref, enabled]);
}
