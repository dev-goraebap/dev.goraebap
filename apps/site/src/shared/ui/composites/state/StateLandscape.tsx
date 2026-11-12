import { useId, useState } from 'react';
import empty from './assets/empty.webp';
import error from './assets/error.webp';
import missing from './assets/not-found.webp';
import search from './assets/search.webp';
import styles from './state.module.css';

/** 상태가 전하는 것: 아직 없음, 조건에 맞는 것 없음, 대상 없음, 실패. */
export type StateKind = 'empty' | 'search' | 'not-found' | 'error';

/** 각 그림과 그림이 끝나는 줄. 아래 여백을 같은 폭으로 잘라 제목이 어느 그림 아래에서나 같은 거리에 놓인다. */
const DRAWINGS: Record<StateKind, readonly [file: string, end: number]> = {
  empty: [empty, 894], search: [search, 865], 'not-found': [missing, 846], error: [error, 879],
};
const TOP = 110;
const MARGIN = 16;
const SIZE = { width: 1536, height: 1024 };
/** 이미 보여 준 그림은 다시 흐리게 시작하지 않는다. */
const shown = new Set<string>();

/**
 * 펜 선 그림을 테마 색으로 칠한다: 검은 선은 보조 아이콘색, 파란 표시는 그림 강조색. 라이트·다크 모두 같은 파일을 쓴다.
 * 파일이 도착하면 한 번 서서히 나타나며, 동작 줄이기 설정에서는 바로 보인다. 장식이라 접근성 트리에서 숨긴다.
 */
export function StateLandscape({ kind }: { kind: StateKind }) {
  const id = `landscape${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [file, end] = DRAWINGS[kind];
  const [loaded, setLoaded] = useState(() => shown.has(file));
  return <svg className={styles.drawing} data-arrived={loaded || undefined} viewBox={`0 ${TOP} ${SIZE.width} ${end + MARGIN - TOP}`}
    preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
    <defs>
      <image id={`${id}-image`} href={file} {...SIZE} onLoad={() => { shown.add(file); setLoaded(true); }} />
      {(['ink', 'accent'] as const).map(part => <filter key={part} id={`${id}-${part}-filter`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values={part === 'ink' ? '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 -1 0 1' : '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -1 0 1 0 0'} />
        <feComposite in2="SourceAlpha" operator="in" />
      </filter>)}
      {(['ink', 'accent'] as const).map(part => <mask key={part} id={`${id}-${part}`} className={styles.mask} maskUnits="userSpaceOnUse" x="0" y="0" {...SIZE}>
        <use href={`#${id}-image`} filter={`url(#${id}-${part}-filter)`} />
      </mask>)}
    </defs>
    <rect {...SIZE} className={styles.ink} mask={`url(#${id}-ink)`} />
    <rect {...SIZE} className={styles.accent} mask={`url(#${id}-accent)`} />
  </svg>;
}
