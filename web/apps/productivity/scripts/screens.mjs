import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

/*
 * Screens for review: signs in to the running dev server with the local server's own development login (its seeded
 * members; dev profile only) and saves a picture of each page, desktop and phone, dark by default.
 *
 *   npm run screens -- --out ../screens [--member 김고래] [--mode dark|light] [--url http://localhost:4420]
 *                      [--desktop '[["work-items","/work-items"]]'] [--phone '[["work-items","/work-items"]]']
 */
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, index, all) =>
  arg.startsWith('--') ? [...pairs, [arg.slice(2), all[index + 1]]] : pairs, []));
const base = args.url ?? 'http://localhost:4420';
const out = args.out ?? 'screens';
const desktop = JSON.parse(args.desktop ?? '[]');
const phone = JSON.parse(args.phone ?? '[]');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
async function shoot(viewport, scale, pages) {
  if (pages.length === 0) return;
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale, colorScheme: args.mode ?? 'dark', locale: 'ko-KR' });
  const page = await context.newPage();
  await page.goto(`${base}/login`);
  const signedIn = await page.evaluate(async name => {
    const people = await (await fetch('/api/v1/auth/dev/employees')).json();
    const member = people.find(person => person.name === name) ?? people[0];
    const csrf = await (await fetch('/api/v1/auth/csrf')).json();
    const response = await fetch('/api/v1/auth/dev/login', { method: 'POST', headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token }, body: JSON.stringify({ userId: member.id }) });
    return response.ok ? member.name : `failed ${response.status}`;
  }, args.member ?? '김고래');
  console.log(`signed in as ${signedIn} (${viewport.width}×${viewport.height})`);
  for (const [name, path] of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/${name}.png` });
    console.log(`  ${name} ← ${path}`);
  }
  await context.close();
}
await shoot({ width: 1440, height: 900 }, 1, desktop);
await shoot({ width: 390, height: 844 }, 2, phone);
await browser.close();
