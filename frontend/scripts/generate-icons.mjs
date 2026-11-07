import fs from 'node:fs/promises';
const solar = JSON.parse(
  await fs.readFile(
    new URL('../../node_modules/@iconify-json/solar/icons.json', import.meta.url),
    'utf8',
  ),
);
const names = {
  library: 'book-bookmark-linear',
  sidebar: 'panel-left-linear',
  folder: 'folder-2-linear',
  search: 'magnifier-linear',
  filter: 'filter-linear',
  sort: 'sort-linear',
  grid: 'widget-2-linear',
  list: 'list-linear',
  plus: 'add-circle-linear',
  close: 'close-circle-linear',
  x: 'close-square-linear',
  info: 'info-circle-linear',
  person: 'user-circle-linear',
  reset: 'restart-linear',
  link: 'link-linear',
  document: 'document-text-linear',
  image: 'gallery-linear',
  arrow: 'arrow-left-linear',
  expand: 'maximize-square-linear',
  sun: 'sun-linear',
  moon: 'moon-linear',
  calendar: 'calendar-linear',
  upload: 'upload-linear',
  check: 'check-circle-linear',
  star: 'star-linear',
  chevron: 'alt-arrow-right-linear',
  refresh: 'refresh-linear',
};
const icons = {};
const selectedIcons = {};
for (const [name, key] of Object.entries(names)) {
  const icon = solar.icons[key];
  if (!icon) throw new Error(`Solar 아이콘 없음: ${key}`);
  icons[name] = icon.body;
  selectedIcons[name] = (
    solar.icons[key.replace('-linear', '-bold-duotone')] ?? icon
  ).body;
}
await fs.writeFile(
  new URL('../src/foundations/solar-icons.ts', import.meta.url),
  '// npm run frontend:icons로 생성한다. 원본은 Solar Linear다.\nexport const solarIcons = ' +
    JSON.stringify(icons, null, 2) +
    ' as const;\nexport const solarSelectedIcons = ' +
    JSON.stringify(selectedIcons, null, 2) +
    ' as const;\n',
);
