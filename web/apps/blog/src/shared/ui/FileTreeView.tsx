import { useState } from "react";

interface TreeLine {
  depth: number;
  name: string;
  isDir: boolean;
  comment?: string;
  highlight: boolean;
}

interface ParsedTree {
  title?: string;
  lines: TreeLine[];
}

function parseTree(source: string): ParsedTree {
  const rawLines = source.replace(/\r\n/g, "\n").split("\n");
  let title: string | undefined;
  const contentLines: string[] = [];

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (contentLines.length === 0 && !title) {
      const titleMatch = /^#\s*title:\s*(.+)$/i.exec(trimmed);
      if (titleMatch) {
        title = titleMatch[1].trim();
        continue;
      }
    }
    contentLines.push(raw);
  }

  // 들여쓰기 단위(보통 2칸) 자동 감지
  const indents = contentLines
    .map((line) => /^(\s*)/.exec(line)?.[1].replace(/\t/g, "  ").length ?? 0)
    .filter((len) => len > 0);
  const unit = indents.length > 0 ? Math.min(...indents) : 2;

  const lines: TreeLine[] = contentLines.map((raw) => {
    const expanded = raw.replace(/\t/g, "  ");
    const leading = /^(\s*)/.exec(expanded)?.[1].length ?? 0;
    const depth = unit > 0 ? Math.round(leading / unit) : 0;
    const rest = expanded.slice(leading);

    // "name   # comment" 분리 (경로에 #이 들어가는 경우는 드물므로 공백 뒤 # 기준)
    const commentMatch = /^(.+?)\s+#\s*(.+)$/.exec(rest);
    const rawName = (commentMatch ? commentMatch[1] : rest).trim();
    const comment = commentMatch?.[2]?.trim();

    const highlight = rawName.startsWith("!");
    const name = highlight ? rawName.slice(1).trim() : rawName;
    const isDir = name.endsWith("/");

    return { depth, name, isDir, comment, highlight };
  });

  return { title, lines };
}

function FolderGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 6a2 2 0 0 1 2-2h4.17a2 2 0 0 1 1.42.59L13 6h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" />
    </svg>
  );
}

function FileGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M14.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5L14.5 3Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function isKeyEntryFile(name: string): boolean {
  return /^(index\.ts|route\.tsx|page\.tsx|routes\.ts|__root\.tsx|\*Facade.*)$/.test(name);
}

export function FileTreeView({ code }: { code: string }) {
  const { title, lines } = parseTree(code);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="border-border/80 bg-muted/35 flex items-center justify-between gap-3 border-b px-4 py-2">
        <span className="text-muted-foreground flex items-center gap-2 font-mono text-xs font-medium">
          <FolderGlyph className="size-3.5" />
          {title ?? lines[0]?.name ?? "디렉토리 구조"}
        </span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="text-muted-foreground hover:text-foreground text-[0.6875rem] font-medium transition-colors"
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      <div className="overflow-x-auto px-3 py-3 sm:px-4">
        <ul className="min-w-max space-y-0.5 font-mono text-[0.8125rem] leading-6">
          {lines.map((item, idx) => {
            const keyEntry = !item.isDir && isKeyEntryFile(item.name);
            return (
              <li
                key={`${idx}-${item.name}`}
                className={`group flex items-baseline justify-between gap-6 rounded-lg px-2 py-0.5 transition-colors ${
                  item.highlight ? "bg-accent/70" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center">
                  {Array.from({ length: item.depth }, (_, level) => (
                    <span
                      key={level}
                      aria-hidden="true"
                      className="border-border/70 mr-3 inline-block h-6 w-2.5 shrink-0 border-l"
                    />
                  ))}
                  {item.isDir ? (
                    <FolderGlyph className="text-primary/80 mr-2 size-3.5 shrink-0" />
                  ) : (
                    <FileGlyph
                      className={`mr-2 size-3.5 shrink-0 ${
                        keyEntry ? "text-foreground" : "text-muted-foreground/80"
                      }`}
                    />
                  )}
                  <span
                    className={
                      item.isDir
                        ? "text-foreground font-semibold"
                        : keyEntry
                          ? "text-foreground font-medium"
                          : "text-foreground/85"
                    }
                  >
                    {item.name}
                  </span>
                </div>
                {item.comment && (
                  <span className="text-muted-foreground font-sans text-xs break-keep">
                    {item.comment}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </figure>
  );
}
