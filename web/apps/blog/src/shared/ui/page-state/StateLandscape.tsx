import { useId, useState } from "react";
import empty01 from "./landscapes/empty-01.webp";
import empty02 from "./landscapes/empty-02.webp";
import empty03 from "./landscapes/empty-03.webp";
import error40401 from "./landscapes/error-404-01.webp";
import error40402 from "./landscapes/error-404-02.webp";
import error40403 from "./landscapes/error-404-03.webp";
import error50001 from "./landscapes/error-500-01.webp";
import error50002 from "./landscapes/error-500-02.webp";
import error50003 from "./landscapes/error-500-03.webp";
import search01 from "./landscapes/search-01.webp";
import search02 from "./landscapes/search-02.webp";
import search03 from "./landscapes/search-03.webp";

export type StateKind = "empty" | "search" | "not-found" | "error";

// 그림마다 선이 끝나는 줄. 아래 여백을 같게 잘라 어느 그림이든 제목이 같은 거리에 놓인다.
const DRAWINGS: Record<StateKind, readonly [file: string, end: number][]> = {
  empty: [
    [empty01, 894],
    [empty02, 902],
    [empty03, 916],
  ],
  search: [
    [search01, 865],
    [search02, 915],
    [search03, 913],
  ],
  "not-found": [
    [error40401, 846],
    [error40402, 951],
    [error40403, 894],
  ],
  error: [
    [error50001, 879],
    [error50002, 914],
    [error50003, 838],
  ],
};
const TOP = 110;
const MARGIN = 16;
const SIZE = { width: 1536, height: 1024 };

const shown = new Set<string>();

function isAtHand(file: string) {
  if (shown.has(file)) return true;
  // 빌드 때 정적 페이지를 그리는 서버에는 Image가 없다.
  if (typeof Image === "undefined") return false;
  const probe = new Image();
  probe.src = file;
  return probe.complete && probe.naturalWidth > 0;
}

// 파일의 검은 선과 파란 표시를 두 마스크로 나눠 테마 색으로 칠한다.
export function StateLandscape({ kind, isCompact }: { kind: StateKind; isCompact?: boolean }) {
  const id = `landscape${useId().replace(/[^\w-]/g, "")}`;
  const [picked] = useState(() => Math.floor(Math.random() * 3));
  const [file, end] = DRAWINGS[kind][picked];
  const [arrived, setArrived] = useState(() => isAtHand(file));
  const layer = (part: "ink" | "accent") => (
    <mask
      id={`${id}-${part}`}
      className="[mask-type:alpha]"
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      {...SIZE}
    >
      <use href={`#${id}-image`} filter={`url(#${id}-${part}-filter)`} />
    </mask>
  );

  return (
    <svg
      viewBox={`0 ${TOP} ${SIZE.width} ${end + MARGIN - TOP}`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
      data-arrived={arrived || undefined}
      className={`block max-w-full translate-y-1 opacity-0 transition-[opacity,translate] duration-600 ease-[cubic-bezier(0.2,0,0,1)] data-arrived:translate-y-0 data-arrived:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none ${
        isCompact ? "h-32 w-60" : "h-44 w-80"
      }`}
    >
      <defs>
        <image
          id={`${id}-image`}
          href={file}
          {...SIZE}
          onLoad={() => {
            shown.add(file);
            setArrived(true);
          }}
        />
        <filter id={`${id}-ink-filter`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 -1 0 1" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        <filter id={`${id}-accent-filter`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -1 0 1 0 0" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        {layer("ink")}
        {layer("accent")}
      </defs>
      <rect {...SIZE} className="fill-muted-foreground" mask={`url(#${id}-ink)`} />
      <rect {...SIZE} className="fill-primary" mask={`url(#${id}-accent)`} />
    </svg>
  );
}
