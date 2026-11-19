// 어댑터(adapters/) 안의 GitHub 고정 커밋 링크가 실제로 존재하는지 온라인으로 확인한다.
// 서브모듈 없이 어댑터를 최신화하거나 링크 상태를 점검할 때 실행한다(npm run check:links).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const ADAPTERS = path.join(root, 'adapters');
const GITHUB_PINNED_LINK = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(blob|tree)\/([0-9a-f]{40})\/([^#?]+)/;

async function collect(directory, out) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await collect(file, out); continue; }
    if (!file.endsWith('.md')) continue;
    const content = await fs.readFile(file, 'utf8');
    for (const [, href] of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (GITHUB_PINNED_LINK.test(href)) {
        const clean = href.split('#')[0].split('?')[0];
        if (!out.has(clean)) out.set(clean, []);
        out.get(clean).push(path.relative(root, file));
      }
    }
  }
}

const urlMap = new Map();
await collect(ADAPTERS, urlMap);

const urls = [...urlMap.keys()];
const broken = [];
const CONCURRENCY = 8;
let index = 0;

async function worker() {
  while (index < urls.length) {
    const current = urls[index++];
    try {
      const res = await fetch(current, { method: 'HEAD', redirect: 'follow' });
      if (!res.ok) broken.push({ url: current, status: res.status, files: urlMap.get(current) });
    } catch (err) {
      broken.push({ url: current, status: err.message, files: urlMap.get(current) });
    }
  }
}

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, () => worker()));

if (broken.length > 0) {
  for (const item of broken) {
    process.stderr.write(`깨진 링크 (${item.status}): ${item.url} ← ${item.files.join(', ')}\n`);
  }
  process.exit(1);
}

process.stdout.write(`어댑터 고정 커밋 링크 ${urls.length}개 모두 확인\n`);
