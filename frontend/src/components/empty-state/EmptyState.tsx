import { useLayoutEffect, useRef } from "react";
import { Button } from "@astryxdesign/core/Button";
import { StateLandscape, type StateKind } from "./StateLandscape";
export function EmptyState({
  kind = "empty",
  title,
  description,
  action,
  onAction,
}: {
  kind?: StateKind;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  const room = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = room.current;
    const content = group.current;
    if (!box || !content) return;
    const place = () => {
      const top = box.getBoundingClientRect().top;
      const spare = box.clientHeight - content.offsetHeight;
      content.style.marginBlockStart = `${Math.round(Math.min(Math.max(innerHeight * 0.32 - top, 0), Math.max(spare, 0)))}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(box);
    observer.observe(content);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);
  return (
    <div ref={room} className="library-empty">
      <div ref={group} className="library-empty-group">
        <StateLandscape kind={kind} />
        <h2>{title}</h2>
        <p>{description}</p>
        {action && (
          <Button label={action} variant="secondary" onClick={onAction} />
        )}
      </div>
    </div>
  );
}
