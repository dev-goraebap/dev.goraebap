import { chromium } from 'playwright';

/*
 * 화면 이동 점검. 단계마다 두 가지를 잰다.
 * - 밀림: 누른 뒤 화면이 보이는 동안 생긴 레이아웃 이동(브라우저의 layout-shift 합). 기준(--limit)을 넘으면 실패한다.
 * - 대기: 누른 뒤 새 화면이 그려지기까지 걸린 시간과 상단 진행 막대가 떴는지. 캐시가 있어야 하는 이동(다시 방문)에서
 *   진행 막대가 뜨면 실패한다: 캐시로 즉시 그리지 않고 기다렸다는 뜻이다(stale-while-revalidate가 깨짐).
 * 실행 중인 개발 서버에 개발 로그인(dev 프로필)으로 들어가 실제 데이터로 이동한다.
 *
 *   npm run layout:check -- [--project DEMO] [--member <이름>] [--url http://localhost:4420] [--limit 0.01] [--width 1440]
 *
 * 단계: 문서함 → 하위 페이지가 있는 문서 → 그 사이드바의 페이지를 차례로 → 3초 넘게 지난 페이지로 다시 방문,
 * 업무 목록 → 업무 상세 → 뒤로 → 같은 상세 다시 방문 → 다른 업무 상세. 새 종류의 화면을 만들면 단계를 더한다.
 */
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, index, all) =>
  arg.startsWith('--') ? [...pairs, [arg.slice(2), all[index + 1]]] : pairs, []));
const base = args.url ?? 'http://localhost:4420';
const project = args.project ?? 'DEMO';
const limit = Number(args.limit ?? 0.01);
const width = Number(args.width ?? 1440);
const PROGRESS = '[data-route-progress]';

// 누른 뒤의 밀림과, 진행 막대가 한 번이라도 보였는지를 기록한다(입력 직후 500ms의 이동은 브라우저가 이미 뺀다).
const watch = progress => {
  window.__shifts = [];
  window.__progress = false;
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue;
      window.__shifts.push({ value: entry.value,
        nodes: entry.sources?.map(source => source.node?.textContent?.trim().slice(0, 40) || source.node?.nodeName).filter(Boolean) ?? [] });
    }
  }).observe({ type: 'layout-shift', buffered: false });
  setInterval(() => { if (document.querySelector(progress)) window.__progress = true; }, 20);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height: Number(args.height ?? 900) }, colorScheme: 'dark', locale: 'ko-KR' });
const page = await context.newPage();
await page.addInitScript(watch, PROGRESS);
await page.goto(`${base}/login`);
const signedIn = await page.evaluate(async name => {
  const people = await (await fetch('/api/v1/auth/dev/employees')).json();
  const member = people.find(person => person.name === name) ?? people[0];
  const csrf = await (await fetch('/api/v1/auth/csrf')).json();
  const response = await fetch('/api/v1/auth/dev/login', { method: 'POST', headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token }, body: JSON.stringify({ userId: member.id }) });
  return response.ok ? member.name : `failed ${response.status}`;
}, args.member ?? '김고래');
if (signedIn.startsWith('failed')) { console.error(`개발 로그인 실패: ${signedIn}`); process.exit(2); }

const settle = async () => {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(selector => !document.querySelector(selector), PROGRESS);
  await page.waitForTimeout(1200);
};
const results = [];
/** act 뒤 새 화면으로 교체가 끝나기까지(주소가 target이고 준비 중 표시 aria-busy가 풀림)를 대기로 잰다. instant인 단계는 진행 막대가 뜨면 실패다. */
const step = async (name, target, act, { instant = false } = {}) => {
  await page.evaluate(() => { window.__shifts = []; window.__progress = false; });
  const start = Date.now();
  await act();
  await page.waitForFunction(path => window.location.pathname === path && !document.querySelector('[aria-busy="true"]'), target, { timeout: 15000, polling: 10 });
  const wait = Date.now() - start;
  await settle();
  const { shifts, progress } = await page.evaluate(() => ({ shifts: window.__shifts, progress: window.__progress }));
  const total = shifts.reduce((sum, shift) => sum + shift.value, 0);
  const problems = [
    ...(total > limit ? [`밀림 ← ${[...new Set(shifts.flatMap(shift => shift.nodes))].slice(0, 4).join(' · ')}`] : []),
    ...(instant && progress ? ['캐시가 있는데 진행 막대가 떴다'] : []),
  ];
  results.push({ name, total, problems });
  console.log(`${problems.length ? '✗' : '✓'} 밀림 ${total.toFixed(4)} · 대기 ${String(wait).padStart(4)}ms${progress ? ' · 진행 막대' : ''}  ${name}${problems.length ? `  ← ${problems.join(' / ')}` : ''}`);
};
// 앱 안의 이동(클릭)으로 간다. 첫 방문은 스플래시 화면 아래에서 그려지므로 재지 않는다.
const clickLink = href => page.evaluate(target => {
  const link = [...document.querySelectorAll('a[href]')].find(each => each.getAttribute('href') === target && each.getBoundingClientRect().width > 0);
  if (!link) throw new Error(`링크 없음: ${target}`);
  link.click();
}, href);
const go = (name, href, options) => step(name, href, () => clickLink(href), options);

const documents = `/projects/${project}/documents`;
await page.goto(base + documents); await settle();
const library = await page.evaluate(async key => (await fetch(`/api/v1/workspace/projects/${key}/document-library`)).json(), project);
const root = library.pages.find(each => !each.parentId && library.pages.some(child => child.parentId === each.id));
if (root) {
  await go('문서함 → 하위 페이지가 있는 문서', `${documents}/${root.id}`);
  // 고정 목차 머리 줄 아래의 리사이즈 컨테이너가 전체 높이를 다시 차지하면 맨 아래 항목이 카드 밖으로 잘린다.
  const scrollProblems = await page.evaluate(() => {
    const nav = document.querySelector('aside[aria-label$="페이지"] nav');
    if (!nav || !nav.getBoundingClientRect().width) return [];
    const frame = nav.closest('aside');
    const scroll = [...nav.children].find(child => getComputedStyle(child).overflowY === 'auto');
    const problems = [];
    if (nav.getBoundingClientRect().bottom > frame.getBoundingClientRect().bottom + 1) problems.push('목차가 콘텐츠 영역 아래로 넘친다');
    if (!scroll) return [...problems, '목차 스크롤 영역이 없다'];
    const before = scroll.scrollTop;
    scroll.scrollTo({ top: scroll.scrollHeight, behavior: 'instant' });
    const last = [...nav.querySelectorAll('a[href]')].at(-1);
    if (last && last.getBoundingClientRect().bottom > nav.getBoundingClientRect().bottom + 1) problems.push('목차 끝 항목이 가려진다');
    scroll.scrollTo({ top: before, behavior: 'instant' });
    return problems;
  });
  results.push({ name: '문서 목차의 높이와 끝 항목', total: 0, problems: scrollProblems });
  console.log(`${scrollProblems.length ? '✗' : '✓'} 문서 목차의 높이와 끝 항목${scrollProblems.length ? ` ← ${scrollProblems.join(' / ')}` : ''}`);
  const tree = []; const collect = id => library.pages.filter(each => each.parentId === id).forEach(each => { tree.push(each); collect(each.id); });
  collect(root.id);
  const readable = tree.filter(each => each.excerpt?.trim() || !library.pages.some(child => child.parentId === each.id));
  for (const each of readable) await go(`사이드바 → ${each.title}`, `${documents}/${each.id}`);
  // 3초 넘게 지난 페이지로 돌아가기: 캐시로 즉시 그리고 뒤에서 확인해야 한다(기다리거나 자리가 비면 실패).
  await page.waitForTimeout(3500);
  await go(`사이드바 → ${root.title} (다시 방문)`, `${documents}/${root.id}`, { instant: true });
  if (readable[0]) await go(`사이드바 → ${readable[0].title} (다시 방문)`, `${documents}/${readable[0].id}`, { instant: true });
} else console.log('- 하위 페이지가 있는 문서가 없어 문서 트리 단계를 건너뜀');

const items = `/projects/${project}/work-items`;
const openList = async () => { await page.goto(base + items); await settle(); await page.waitForSelector(`a[href^="${items}/"]`, { timeout: 10000 }); };
await openList();
const rows = await page.evaluate(prefix => [...new Set([...document.querySelectorAll('a[href]')].map(each => each.getAttribute('href'))
  .filter(href => href.startsWith(`${prefix}/`) && /^[0-9]+$/.test(href.slice(prefix.length + 1))))].slice(0, 2), items);
if (rows[0]) {
  await go(`업무 목록 → ${rows[0].split('/').pop()}번 상세`, rows[0]);
  await step('업무 상세 → 뒤로(목록)', items, () => page.goBack(), { instant: true });
  await page.waitForTimeout(3500);
  await go(`업무 목록 → ${rows[0].split('/').pop()}번 상세 (다시 방문)`, rows[0], { instant: true });
}
if (rows[1]) { await openList(); await go(`업무 목록 → ${rows[1].split('/').pop()}번 상세`, rows[1]); }

await browser.close();
const failed = results.filter(each => each.problems.length);
console.log(`\n${results.length}단계 중 ${failed.length}단계가 실패했습니다(밀림 기준 ${limit}, 다시 방문은 진행 막대 없이).`);
process.exit(failed.length ? 1 : 0);
