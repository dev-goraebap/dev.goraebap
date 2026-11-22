import { useState } from "react";
import { Check, Copy } from "lucide-react";
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
              <span className="bg-secondary text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                {language}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            <span>{copied ? "복사됨" : "복사"}</span>
          </button>
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
