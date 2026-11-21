import { chromium } from 'playwright';

// 실제 로컬 문서 편집 화면에서 메뉴 위치를 검사한다. 본문과 설정을 저장하지 않는다.
// npm run editor-menu:check -- --document <문서 UUID> [--project DEMO] [--member <이름>]
const args = Object.fromEntries(process.argv.slice(2).reduce((out, arg, index, all) =>
  arg.startsWith('--') ? [...out, [arg.slice(2), all[index + 1]]] : out, []));
if (!/^[0-9a-f-]{36}$/i.test(args.document ?? '')) throw new Error('--document에 텍스트 블록이 있는 로컬 문서 UUID를 주세요.');
const base = args.url ?? 'http://localhost:4420';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${base}/login`);
  await page.evaluate(async name => {
    const people = await (await fetch('/api/v1/auth/dev/employees')).json();
    const person = people.find(each => each.name === name);
    if (!person) throw new Error('개발 로그인 구성원을 찾지 못했습니다.');
    const csrf = await (await fetch('/api/v1/auth/csrf')).json();
    const response = await fetch('/api/v1/auth/dev/login', { method: 'POST',
      headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token }, body: JSON.stringify({ userId: person.id }) });
    if (!response.ok) throw new Error(`개발 로그인 실패: ${response.status}`);
  }, args.member ?? '김고래');
  await page.goto(`${base}/projects/${encodeURIComponent(args.project ?? 'DEMO')}/documents/${args.document}/edit`);
  await page.locator('[contenteditable=true]').waitFor();
  await page.getByRole('button', { name: '1번 블록 선택', exact: true }).click();
  const check = async label => {
    await page.getByRole('menuitem', { name: label, exact: true }).click();
    await page.waitForTimeout(150);
    const problems = await page.evaluate(name => {
      const panel = document.querySelector(`[role="menu"][aria-label="${name}"]`);
      const menu = panel.closest('[aria-label="블록 메뉴"]');
      const trigger = menu.querySelector('[data-sub] > button[aria-expanded=true]');
      const p = panel.getBoundingClientRect(), m = menu.getBoundingClientRect(), t = trigger.getBoundingClientRect();
      const errors = [];
      if (p.left < 7 || p.top < 7 || p.right > innerWidth - 7 || p.bottom > innerHeight - 7) errors.push('화면 밖으로 넘침');
      if (p.top > t.top + 7 || p.bottom < t.bottom - 7) errors.push('여는 항목과 세로 위치가 떨어짐');
      if (innerWidth - m.right >= p.width + 8 && (p.left - m.right < 4 || p.left - m.right > 16)) errors.push('상위 메뉴 오른쪽에 붙지 않음');
      else if (innerWidth - m.right < p.width + 8 && m.left >= p.width + 8 && (m.left - p.right < 4 || m.left - p.right > 16)) errors.push('왼쪽 대체 배치가 어긋남');
      return errors;
    }, label);
    if (problems.length) throw new Error(`${label}: ${problems.join(', ')}`);
    console.log(`✓ ${label} 위치`);
  };
  // 블록 메뉴의 하위 메뉴는 색 · 종류 바꾸기 둘이다(인쇄 배치는 PDF 미리보기로 옮겼다, 1a634d9e).
  for (const label of ['색', '종류 바꾸기']) await check(label);
  await page.setViewportSize({ width: 1260, height: 680 }); await check('종류 바꾸기');
  await page.evaluate(() => {
    let container = document.querySelector('[contenteditable=true]')?.parentElement;
    while (container && !/(auto|scroll)/.test(getComputedStyle(container).overflowY)) container = container.parentElement;
    container?.scrollBy({ top: 80, behavior: 'instant' });
  });
  await check('종류 바꾸기');
  await page.getByRole('menuitem', { name: '종류 바꾸기', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => !!document.activeElement?.closest('[role="menu"][aria-label="종류 바꾸기"]'));
  await page.keyboard.press('Escape');
  if (await page.getByRole('menu', { name: '종류 바꾸기', exact: true }).count()) throw new Error('Escape 후 하위 메뉴가 남았습니다.');
  console.log('✓ 창 크기 변경·스크롤·키보드');
} finally { await browser.close(); }
