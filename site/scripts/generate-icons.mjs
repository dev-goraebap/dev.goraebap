import fs from 'node:fs/promises';

// 화면이 부르는 의미 이름과 그 이름이 그리는 Solar 아이콘. 기본은 Linear, 고름·열림·현재 위치는 같은 아이콘의 Bold Duotone이다.
// 사용하는 이름만 둔다. 이름을 더하면 npm run site:icons로 다시 생성한다.
const SOLAR = {
  agent: 'code-square', home: 'home-smile', inbox: 'inbox', bell: 'bell', calendar: 'calendar', document: 'document-text', book: 'book',
  library: 'book-bookmark', folder: 'folder', settings: 'settings', user: 'user-circle', people: 'users-group-rounded',
  shield: 'shield-check', plus: 'add', more: 'menu-dots', menu: 'hamburger-menu', sidebar: 'panel-left',
  edit: 'pen-new-square', delete: 'trash-bin-minimalistic', tag: 'tag', pin: 'pin', star: 'star', view: 'eye',
  back: 'arrow-left', previous: 'alt-arrow-left', forward: 'alt-arrow-right', 'chevron-down': 'alt-arrow-down',
  upload: 'cloud-upload', download: 'download-minimalistic', image: 'gallery', attachment: 'paperclip', link: 'link', copy: 'copy',
  close: 'close', retry: 'refresh', alert: 'danger-triangle', info: 'info-circle', done: 'check-circle', check: 'check',
  clock: 'clock-circle', sun: 'sun', moon: 'moon', computer: 'monitor', search: 'magnifier', filter: 'tuning-2',
  sort: 'sort-vertical', 'layout-list': 'list', 'layout-grid': 'widget-2', 'layout-table': 'table', 'layout-board': 'kanban',
  'expand-page': 'full-screen', archive: 'archive-down', restore: 'restart', lock: 'lock-keyhole-minimalistic',
  comment: 'chat-round-dots', grip: 'grip-vertical', move: 'move-to-folder', previous: 'alt-arrow-left', next: 'alt-arrow-right', fold: 'double-alt-arrow-left', unfold: 'double-alt-arrow-right',
  // 리치 에디터(composites/editor): 서식·블록 종류·블록 메뉴·미디어 도구.
  bold: 'text-bold', italic: 'text-italic', underline: 'text-underline', strike: 'text-cross', code: 'code', heading: 'text-format',
  paragraph: 'text-square', 'list-bullet': 'list', 'list-ordered': 'list-ordered', 'list-task': 'checklist', quote: 'quote', table: 'table',
  minus: 'minus', 'code-block': 'code-square', diagram: 'structure', globe: 'global', 'arrows-vertical': 'transfer-vertical', enter: 'reply',
  palette: 'palette-round', 'turn-into': 'square-transfer-horizontal', eraser: 'eraser', clipboard: 'clipboard', 'link-block': 'link-minimalistic-2',
  'arrow-up': 'arrow-up', 'arrow-down': 'arrow-down', 'arrow-left': 'arrow-left', 'arrow-right': 'arrow-right', external: 'arrow-right-up',
  video: 'video-frame-play-horizontal', audio: 'music-note', 'alert-circle': 'danger-circle',
};

const solar = JSON.parse(await fs.readFile(new URL('../../node_modules/@iconify-json/solar/icons.json', import.meta.url), 'utf8'));
const body = (key, style) => solar.icons[`${key}-${style}`]?.body;
const lines = Object.entries(SOLAR).map(([name, key]) => {
  const linear = body(key, 'linear');
  if (!linear) throw new Error(`Solar 아이콘 없음: ${key}-linear`);
  const chosen = body(key, 'bold-duotone');
  return `  ${JSON.stringify(name)}: [${JSON.stringify(linear)}${chosen ? `, ${JSON.stringify(chosen)}` : ''}],`;
});
await fs.writeFile(new URL('../src/shared/ui/foundations/icons/solar-icons.ts', import.meta.url),
  `// npm run site:icons로 생성한다. 직접 고치지 않는다.\n// Solar icons by 480 Design, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).\n` +
  `export const SOLAR_ICONS = {\n${lines.join('\n')}\n} as const satisfies Record<string, readonly [linear: string, boldDuotone?: string]>;\n\n` +
  `export type IconName = keyof typeof SOLAR_ICONS;\n`);
