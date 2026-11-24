import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ThemedToken } from "shiki/core";
import { tokenizeCodeAsync, tokenizeCodeSync } from "../lib/highlight";

interface CodeViewProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeView({ code, language, className }: CodeViewProps) {
  const syncLines = useMemo(() => tokenizeCodeSync(code, language), [code, language]);
  const [asyncState, setAsyncState] = useState<{
    key: string;
    lines: ThemedToken[][];
  } | null>(null);

  const cacheKey = `${language ?? "text"}:${code}`;

  useEffect(() => {
    if (syncLines) return;
    let cancelled = false;
    void tokenizeCodeAsync(code, language).then((lines) => {
      if (!cancelled) {
        setAsyncState({ key: cacheKey, lines });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, code, language, syncLines]);

  const lines = syncLines ?? (asyncState?.key === cacheKey ? asyncState.lines : null);

  return (
    <pre className={className}>
      <code className="shiki-code">
        {lines
          ? lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {line.map((token, tokenIndex) => (
                  <span key={`${lineIndex}-${tokenIndex}`} style={token.htmlStyle as CSSProperties}>
                    {token.content}
                  </span>
                ))}
                {lineIndex < lines.length - 1 ? "\n" : null}
              </Fragment>
            ))
          : code}
      </code>
    </pre>
  );
}
