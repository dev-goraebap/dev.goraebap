import { useState } from "react";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Button } from "@goraebap/ui-react/components/button";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { CodeView } from "./CodeView";

interface CopyCodeBlockProps {
  code: string;
  label?: string;
  language?: string;
}

export function CopyCodeBlock({ code, label, language }: CopyCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      {(label || language) && (
        <div className="border-border bg-muted/40 flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            {label && <span className="text-foreground font-mono text-xs">{label}</span>}
            {language && (
              <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[10px]">
                {language}
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-xs"
          >
            <SystemIcon name={copied ? "check" : "copy"} className="size-3.5" />
            <span>{copied ? "복사됨" : "복사"}</span>
          </Button>
        </div>
      )}
      <CodeView
        code={code}
        language={language}
        className="text-foreground overflow-x-auto p-4 font-mono text-xs leading-relaxed"
      />
    </div>
  );
}
