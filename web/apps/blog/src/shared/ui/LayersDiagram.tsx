interface LayerTier {
  name: string;
  badge?: string;
  description: string;
  optional: boolean;
}

interface ParsedLayers {
  title?: string;
  caption?: string;
  direction: "down" | "up" | "none";
  tiers: LayerTier[];
}

function parseLayers(source: string): ParsedLayers {
  let title: string | undefined;
  let caption: string | undefined;
  let direction: "down" | "up" | "none" = "down";
  const tiers: LayerTier[] = [];

  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const meta = /^#\s*(title|caption|direction):\s*(.+)$/i.exec(trimmed);
    if (meta) {
      const key = meta[1].toLowerCase();
      const value = meta[2].trim();
      if (key === "title") title = value;
      else if (key === "caption") caption = value;
      else if (key === "direction" && (value === "down" || value === "up" || value === "none")) {
        direction = value;
      }
      continue;
    }
    const parts = trimmed.split("|").map((p) => p.trim());
    if (parts.length >= 3) {
      const [name, badge, ...rest] = parts;
      const description = rest.join(" | ");
      const optional = /선택|optional/i.test(badge);
      tiers.push({ name, badge, description, optional });
    } else if (parts.length === 2) {
      tiers.push({ name: parts[0], description: parts[1], optional: false });
    } else {
      tiers.push({ name: parts[0], description: "", optional: false });
    }
  }

  return { title, caption, direction, tiers };
}

function FlowArrow({ direction }: { direction: "down" | "up" }) {
  return (
    <div aria-hidden="true" className="text-muted-foreground/70 flex justify-center py-0.5">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5"
      >
        {direction === "down" ? (
          <>
            <path d="M8 2.5v10" />
            <path d="m4.75 9.5 3.25 3.25 3.25-3.25" />
          </>
        ) : (
          <>
            <path d="M8 13.5v-10" />
            <path d="m4.75 6.5 3.25-3.25 3.25 3.25" />
          </>
        )}
      </svg>
    </div>
  );
}

export function LayersDiagram({ code }: { code: string }) {
  const { title, caption, direction, tiers } = parseLayers(code);

  return (
    <figure className="border-border bg-card overflow-hidden rounded-2xl border">
      {title && (
        <div className="border-border/80 bg-muted/35 flex items-center justify-between gap-2 border-b px-4 py-2">
          <span className="text-muted-foreground text-xs font-medium">{title}</span>
          {direction !== "none" && (
            <span className="text-muted-foreground/80 font-mono text-[0.6875rem]">
              {direction === "down" ? "의존 방향 ↓" : "의존 방향 ↑"}
            </span>
          )}
        </div>
      )}

      <div className="bg-dots bg-background/70 p-4 sm:p-6">
        <ol className="mx-auto max-w-2xl space-y-1">
          {tiers.map((tier, index) => (
            <li key={`${index}-${tier.name}`}>
              <div
                className={`bg-card flex flex-col gap-1.5 rounded-xl border px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                  tier.optional
                    ? "border-border/90 bg-card/80 border-dashed"
                    : "border-border shadow-2xs"
                }`}
              >
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-foreground font-mono text-sm font-semibold">
                    {tier.name}
                  </span>
                  {tier.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${
                        tier.optional
                          ? "bg-muted text-muted-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="text-muted-foreground text-xs leading-relaxed break-keep sm:text-right sm:text-[0.8125rem]">
                    {tier.description}
                  </p>
                )}
              </div>
              {direction !== "none" && index < tiers.length - 1 && (
                <FlowArrow direction={direction} />
              )}
            </li>
          ))}
        </ol>
      </div>

      {caption && (
        <figcaption className="border-border/80 text-muted-foreground border-t px-4 py-2.5 text-center text-xs break-keep">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
