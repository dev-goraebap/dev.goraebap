import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PortalContainerContext } from "@goraebap/ui-react/lib/portal-container";

export function ThemedPortalScope({ theme, children }: { theme: string; children: ReactNode }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <PortalContainerContext value={host}>
      {/* 정적 페이지를 만드는 서버에는 document가 없다. 그때는 포털 자리 없이 그리고 브라우저가 이어받는다. */}
      {typeof document !== "undefined" &&
        createPortal(
          <div ref={setHost} data-ds-theme={theme} className="contents" />,
          document.body,
        )}
      {children}
    </PortalContainerContext>
  );
}
