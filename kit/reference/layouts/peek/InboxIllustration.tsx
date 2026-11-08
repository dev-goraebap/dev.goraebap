import styles from './inbox-layout.module.css';
import inbox from './inbox-layout.module.css';

export function InboxIllustration() {
  return <svg viewBox="0 0 320 176" className={styles.drawing} data-arrived aria-hidden="true" focusable="false">
    <g className={inbox.ink} fill="none" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M25 144c62-1 111 2 167 0 38-1 69-1 101 0M41 150l58 1m103 0 68-1M116 153h40" opacity=".45" />
      <path d="M73 108 95 85h129l24 23M83 106l17-15h119l18 15" />
      <path d="m124 105 12-63a4 4 0 0 1 5-3l64 12a4 4 0 0 1 3 5l-11 57z" className={inbox.paper} />
      <path d="m147 48 38 7" opacity=".55" />
      <path d="m104 107 1-44a4 4 0 0 1 4-4l75 3a4 4 0 0 1 4 4l-2 46z" className={inbox.paper} />
      <path d="m107 64 35 24a7 7 0 0 0 8 0l35-22m-52 15-21 19m49-18 20 20" opacity=".72" />
      <path d="m153 118 9-40a4 4 0 0 1 5-3l47 10a4 4 0 0 1 3 5l-6 28z" className={inbox.paper} />
      <path d="m164 81 20 21a5 5 0 0 0 6 1l24-14" opacity=".65" />
      <path d="M73 108h59l7 13h43l8-13h58v29a6 6 0 0 1-6 6H79a6 6 0 0 1-6-6z" className={inbox.paper} />
      <path d="M85 130v5h47m53 0h49v-5m-139-39-12 14m143-14 13 13" opacity=".45" />
      <path d="M32 142c3-11 10-13 12 0m-2 0c5-20 12-16 12 0m210 0c1-11 8-13 10 0m1 0c3-16 10-14 11 0M52 115l6-1m211-13 8 2" opacity=".55" />
      <path d="m65 67 5-4m-1 13 5-2m162-20 5 1m-7 6 8 3" opacity=".55" />
    </g>
    <g className={inbox.accent} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M229 30v17m-8-8h16m-15-5 3 3m7 6 3 3" />
      <path d="M55 84v10m-5-5h10m202-11v8m-4-4h8" opacity=".65" />
      <path d="M147 125h27" />
    </g>
    <circle className={inbox.accentDot} cx="212" cy="61" r="3" />
  </svg>;
}
