import type { ReactNode } from "react";
import { useDesignConfig } from "../lib/design-config";
import { AdapterCodePanel } from "./AdapterCodePanel";
import { ThemedPortalScope } from "./ThemedPortalScope";

interface AdapterPreviewStageProps {
  reactCode: string;
  angularCode: string;
  recipeCode?: string;
  renderReact: () => ReactNode;
}

export function AdapterPreviewStage({
  reactCode,
  angularCode,
  recipeCode,
  renderReact,
}: AdapterPreviewStageProps) {
  const { config } = useDesignConfig();

  return (
    <ThemedPortalScope theme={config.theme}>
      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <div
          data-ds-theme={config.theme}
          className="bg-dots bg-background/70 flex min-h-64 items-center justify-center px-6 py-12 transition-colors"
        >
          <div className="text-foreground w-full max-w-2xl">{renderReact()}</div>
        </div>
        <AdapterCodePanel reactCode={reactCode} angularCode={angularCode} recipeCode={recipeCode} />
      </div>
    </ThemedPortalScope>
  );
}
