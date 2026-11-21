import { readFile, writeFile } from 'node:fs/promises';

// The meaning names screens call solarIcon with, and the Solar icon each draws, in Linear (first made for the old client/,
// with web/'s own: the menu's fold arrows, and shield-check for what guards).
const SOLAR = {
  home: 'home-smile', town: 'gamepad', projects: 'case-round', code: 'code', commit: 'git-commit', wiki: 'folder',
  component: 'widget-add', release: 'rocket', ticket: 'ticket', workflow: 'branching-paths-down', sound: 'volume-loud',
  muted: 'volume-cross', people: 'users-group-rounded', dashboard: 'widget', bell: 'bell', inbox: 'inbox', received: 'inbox-in',
  sent: 'plain', copies: 'eye', view: 'eye', pin: 'pin', calendar: 'calendar', document: 'document-text', book: 'book',
  notice: 'notification-unread-lines', checklist: 'checklist', support: 'help',
  feedback: 'chat-round-line', desk: 'headphones-round-sound', contribute: 'git-pull-request', idea: 'lightbulb',
  settings: 'settings', user: 'user-circle', shield: 'shield-check', plus: 'add', more: 'menu-dots', menu: 'hamburger-menu',
  sidebar: 'panel-left', edit: 'pen-new-square', delete: 'trash-bin-minimalistic', departments: 'structure', ranks: 'ranking',
  title: 'medal-ribbon', tag: 'tag', transcript: 'microphone', meeting: 'notebook-minimalistic', leave: 'umbrella', absence: 'pause-circle', holiday: 'calendar-mark',
  lookup: 'user-id', grip: 'grip-vertical', back: 'alt-arrow-left', previous: 'alt-arrow-left', forward: 'alt-arrow-right', 'chevron-down': 'alt-arrow-down',
  upload: 'cloud-upload', image: 'gallery', pdf: 'file-text', sheet: 'file-spreadsheet', doc: 'document-text',
  download: 'download-minimalistic', close: 'close', retry: 'refresh', alert: 'danger-triangle', done: 'check-circle',
  attachment: 'paperclip', logout: 'logout-2', clock: 'clock-circle', team: 'users-group-two-rounded', sun: 'sun', moon: 'moon',
  computer: 'monitor', search: 'magnifier', 'search-focus': 'magnifier-zoom-in', filter: 'tuning-2', check: 'check',
  sort: 'sort-vertical', 'sort-desc': 'sort-from-top-to-bottom', 'sort-asc': 'sort-from-bottom-to-top', repeat: 'repeat',
  location: 'map-point', event: 'calendar-add', copy: 'copy', link: 'link', 'layout-list': 'list', 'layout-board': 'kanban',
  'layout-table': 'table', 'layout-timeline': 'chart-2', 'expand-page': 'full-screen', agent: 'stars',
  // Favourites, a project's key and its archive, and the further icons a project's mark picks from (MARK_ICONS).
  star: 'star', key: 'hashtag', archive: 'archive-down', unarchive: 'archive-up', restore: 'restart', lock: 'lock-keyhole-minimalistic',
  rows: 'rows-3', milestone: 'signpost', decision: 'scale', priority: 'chart-2', siren: 'siren', branch: 'git-branch', tasks: 'notes',
  // A work item's types beside checklist (작업) and idea (기능): 버그 and 에픽.
  bug: 'bug-minimalistic', epic: 'bolt', comment: 'chat-round-dots',
  // A body's version history (상세 정보의 버전 줄): fills the 20 grid as 작성일·수정일 do, where restart draws smaller.
  history: 'history',
  // A work item's first line in its 활동 (만들었습니다).
  created: 'stars-2',
  // A document space's folder, in its tree and lists.
  folder: 'folder',
  // The side menu's fold and unfold.
  fold: 'double-alt-arrow-left', unfold: 'double-alt-arrow-right',
  // A row's own menu standing upright (one's box under the logo): Solar draws its dots lying only, so they are turned (TURNED).
  'more-vertical': 'menu-dots',
};

// The names drawn as their Solar icon turned a quarter round: Solar has no upright form of them.
const TURNED = ['more-vertical'];

// The Solar icons a mark picker offers after the app's own mark icons (MARK_ICONS, shared/config/palette.ts), drawn at once
// rather than with the whole set, as `s:` and the name a mark keeps them by (BIT's MARKS, less those MARK_ICONS already draws:
// rocket is release, code is code, lightbulb is idea, book is book, notes is tasks).
const MARKS = ['star', 'heart', 'target', 'bug', 'palette', 'case', 'global', 'bolt', 'bell', 'box', 'buildings', 'chart-2', 'card', 'database',
  'gift', 'square-academic-cap', 'smartphone', 'cup-star', 'bot', 'brain', 'cloud', 'cup-hot', 'compass', 'fire', 'leaf', 'map', 'music-note',
  'widget-2'];

// The names that can be drawn chosen or in force (the menus' and spaces' entries, a phone's tabs, a picked layout): these
// also carry the same icon's Bold Duotone, which NavIcon draws for isSelected. The rest ship Linear only, keeping the
// bundle small; a name chosen but not listed stays Linear.
const CHOSEN = ['bell', 'book', 'calendar', 'checklist', 'clock', 'code', 'component', 'contribute', 'dashboard', 'departments',
  'desk', 'document', 'feedback', 'home', 'inbox', 'leave', 'notice', 'projects', 'ranks', 'shield', 'sun', 'tag', 'team', 'town',
  'user', 'more', 'support', 'release', 'ticket', 'workflow', 'wiki', 'people', 'settings', 'layout-list', 'layout-board',
  'layout-table', 'layout-timeline', 'star', 'location', 'folder', 'received', 'transcript', 'meeting', 'feedback',
  // web/: whatever can stand pressed, open or chosen (tools, menus' items, the phone's 더보기) turns Bold Duotone too.
  'filter', 'sort', 'sort-asc', 'sort-desc', 'clock', 'event', 'absence', 'done', 'link', 'archive', 'delete', 'close',
  'computer', 'agent', 'logout', 'check', 'plus', 'edit', 'copy', 'search', 'priority', 'bug', 'epic', 'idea', 'tasks', 'tag', 'rows', 'menu',
  'more-vertical', 'sidebar'];

const { icons } = JSON.parse(await readFile(new URL('../node_modules/@iconify-json/solar/icons.json', import.meta.url), 'utf8'));
const body = (name, solar, style) => {
  const icon = icons[`${solar}-${style}`];
  if (!icon) throw new Error(`Solar has no ${solar}-${style} for ${name}`);
  return JSON.stringify(TURNED.includes(name) ? `<g transform="rotate(90 12 12)">${icon.body}</g>` : icon.body);
};
for (const name of CHOSEN) if (!SOLAR[name]) throw new Error(`${name} is chosen but has no Solar icon`);
const lines = [...Object.entries(SOLAR), ...MARKS.map(solar => [`s:${solar}`, solar])].map(([name, solar]) => `  ${JSON.stringify(name)}: [${body(name, solar, 'linear')}`
  + `${CHOSEN.includes(name) ? `, ${body(name, solar, 'bold-duotone')}` : ''}],`);
await writeFile(new URL('../src/shared/ui/icons/solar-icons.ts', import.meta.url), `// Generated by scripts/generate-icons.mjs from @iconify-json/solar; do not edit.
// Solar icons by 480 Design, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
/** Solar SVG bodies on the 24 grid: Linear, then Bold Duotone for a name that can be drawn chosen. */
export const SOLAR_ICONS: Readonly<Record<string, readonly [linear: string, boldDuotone?: string]>> = {
${lines.join('\n')}
};
`);
console.log(`${lines.length} Solar icons written.`);
