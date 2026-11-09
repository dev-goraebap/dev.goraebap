// 내용에 맞춰 크는 견본(부품 견본)의 크기를 미리 잰다. 첫 방문에도 견본이 처음부터 제 높이로 자리를 잡아 글이 밀리지
// 않게 하려는 것이다. 실행 중인 가이드 개발 서버(기본 http://localhost:4451)에서 크는 견본마다 실제 기기 폭으로 띄워,
// 견본이 알려 온 크기를 site/src/widgets/samples/sample-sizes.json에 쓴다. 견본을 더하거나 모양을 바꾸면
// `npm run site` 를 띄운 채로 `npm run site:sizes` 를 다시 돌린다.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(here, '../src/widgets/samples/sample-sizes.json');
const origin = process.argv[2] ?? 'http://localhost:4451';

// 견본 화면(sample.html)은 내용에 맞춰 크는 견본이면 부모 창에 크기를 알린다(SampleFrame의 useReportSize). 가이드 사이트와
// 같은 출처의 빈 문서에 견본마다 실제 기기 폭의 iframe을 띄워 그 크기를 모은다. 키는 견본 부품(Sample)과 같은 "id:기기"다.
const WIDTH = { desktop: 1280, phone: 390 };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
await page.goto(`${origin}/webcraft/`);
await page.waitForLoadState('networkidle');
const sizes = await page.evaluate(async width => {
  const { loadAll } = await import('/samples/catalog/registry.ts');
  const auto = (await loadAll()).filter(entry => entry.layout !== 'fullscreen' && !entry.height);
  const found = {};
  const host = document.createElement('div');
  Object.assign(host.style, { position: 'fixed', left: '-99999px', top: '0' });
  document.body.append(host);
  // 한 번에 몇 개씩 띄워 잰다.
  for (let index = 0; index < auto.length; index += 6) {
    await Promise.all(auto.slice(index, index + 6).map(entry => new Promise(resolve => {
      const frame = document.createElement('iframe');
      let timer = 0;
      const done = () => { window.removeEventListener('message', receive); clearTimeout(timer); frame.remove(); resolve(); };
      const receive = event => {
        if (event.source !== frame.contentWindow || event.data?.type !== 'sample-size') return;
        found[`${entry.id}:${entry.device}`] = { width: Math.ceil(event.data.width), height: Math.ceil(event.data.height) };
        // 글꼴·그림이 늦게 붙어 커질 수 있으니 잠깐 더 받은 뒤 닫는다.
        clearTimeout(timer); timer = setTimeout(done, 700);
      };
      window.addEventListener('message', receive);
      timer = setTimeout(done, 10000);
      Object.assign(frame.style, { width: `${width[entry.device]}px`, height: '160px', border: '0' });
      frame.src = `/sample.html?id=${encodeURIComponent(entry.id)}`;
      host.append(frame);
    })));
  }
  return found;
}, WIDTH);
await browser.close();
const sorted = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(output, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`${Object.keys(sorted).length}개 견본 크기를 ${path.relative(process.cwd(), output)}에 썼습니다.`);
