import { useState } from "react";

interface CopyCommandProps {
  command: string;
  label?: string;
}

export function CopyCommand({ command, label }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="border-border bg-secondary/60 flex items-center justify-between gap-3 rounded-md border px-3 py-2 font-mono text-xs">
      <div className="flex min-w-0 items-center gap-2">
        {label ? <span className="text-muted-foreground shrink-0">{label}</span> : null}
        <code className="text-foreground truncate">{command}</code>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted-foreground hover:bg-background hover:text-foreground shrink-0 cursor-pointer rounded px-2 py-1 text-[11px] font-medium transition-colors"
      >
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}
