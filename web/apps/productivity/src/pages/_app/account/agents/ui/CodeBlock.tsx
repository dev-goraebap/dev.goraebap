import { useEffect, useState } from 'react';
import { cn } from 'cn';
import { Button } from '@goraebap/ui-react/compact/button';
import { CheckIcon, CopyIcon } from '@/shared/ui/kit/icon';

/**
 * A piece of text to copy as it is (a token, a command, instructions): its name over a quiet box of monospaced, wrapped
 * text, and a copy button that says it worked for a moment. isTall caps a long one at 20rem and lets it scroll.
 */
export function CodeBlock({ title, code, isTall = false }: { title: string; code: string; isTall?: boolean }) {
  const [isCopied, setCopied] = useState(false);
  useEffect(() => {
    if (!isCopied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [isCopied]);
  const copy = () => void navigator.clipboard.writeText(code).then(() => setCopied(true), () => setCopied(false));
  return (
    <figure className="flex min-w-0 flex-col gap-1.5">
      <figcaption className="flex min-h-7 items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span className="min-w-0">{title}</span>
        <Button variant="ghost" size="xs" aria-label={`${title} 복사`} onClick={copy}>
          {isCopied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {isCopied ? '복사됨' : '복사'}
        </Button>
      </figcaption>
      <pre className={cn('min-w-0 overflow-x-hidden rounded-lg border bg-muted px-3 py-2 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap',
        isTall && 'max-h-80 overflow-y-auto')}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
