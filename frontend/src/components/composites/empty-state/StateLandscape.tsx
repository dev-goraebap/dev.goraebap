import { useId, useState } from "react";
import empty from "./assets/states/empty.webp";
import search from "./assets/states/search.webp";
import missing from "./assets/states/not-found.webp";
import error from "./assets/states/error.webp";
export type StateKind = "empty" | "search" | "not-found" | "error";
const drawings = {
  empty: [empty, 894],
  search: [search, 865],
  "not-found": [missing, 846],
  error: [error, 879],
} as const;
const shown = new Set<string>();
/** 그림의 선과 강조 부분을 테마 색으로 칠하고, 본 이미지는 다시 흐리지 않는다. */
export function StateLandscape({ kind }: { kind: StateKind }) {
  const id = `landscape${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [file, end] = drawings[kind];
  const [loaded, setLoaded] = useState(() => {
    if (shown.has(file)) return file;
    const probe = new Image();
    probe.src = file;
    return probe.complete && probe.naturalWidth > 0 ? file : undefined;
  });
  const size = { width: 1536, height: 1024 };
  return (
    <svg
      className="library-state-landscape"
      data-loaded={loaded === file || undefined}
      viewBox={`0 110 1536 ${end + 16 - 110}`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <image
          id={`${id}-image`}
          href={file}
          {...size}
          onLoad={() => {
            shown.add(file);
            setLoaded(file);
          }}
        />
        {(["ink", "accent"] as const).map((part) => (
          <filter
            key={part}
            id={`${id}-${part}-filter`}
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              type="matrix"
              values={
                part === "ink"
                  ? "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 -1 0 1"
                  : "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -1 0 1 0 0"
              }
            />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        ))}
        {(["ink", "accent"] as const).map((part) => (
          <mask
            key={part}
            id={`${id}-${part}`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            {...size}
          >
            <use href={`#${id}-image`} filter={`url(#${id}-${part}-filter)`} />
          </mask>
        ))}
      </defs>
      <rect {...size} className="library-state-ink" mask={`url(#${id}-ink)`} />
      <rect
        {...size}
        className="library-state-accent"
        mask={`url(#${id}-accent)`}
      />
    </svg>
  );
}
