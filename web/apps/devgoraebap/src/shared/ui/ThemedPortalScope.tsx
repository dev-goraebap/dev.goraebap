import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PortalContainerContext } from "@goraebap/ui-react/lib/portal-container";

export function ThemedPortalScope({ theme, children }: { theme: string; children: ReactNode }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <PortalContainerContext value={host}>
      {createPortal(
        <div ref={setHost} data-ds-theme={theme} className="contents" />,
        document.body,
      )}
      {children}
    </PortalContainerContext>
  );
}
