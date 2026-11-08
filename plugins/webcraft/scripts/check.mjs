import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
let skills = 0;
let links = 0;
async function check(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `링크 파일은 배포하지 않습니다: ${file}`);
    if (entry.isDirectory()) { await check(file); continue; }
    if (!file.endsWith('.md')) continue;
    const content = await fs.readFile(file, 'utf8');
    if (entry.name === 'SKILL.md') {
      const frontmatter = /^---\r?\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\r?\ndescription: ([^\r\n]+)\r?\n---/.exec(content);
      assert(frontmatter, `스킬 frontmatter가 잘못됐습니다: ${file}`);
      assert.equal(frontmatter[1], path.basename(directory));
      assert(frontmatter[1].length <= 64);
      assert(content.split('\n').length < 500);
      skills++;
    }
    for (const [, href] of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^(https?:|#)/.test(href)) continue;
      const target = path.resolve(directory, href.split('#')[0]);
      assert(!path.relative(root, target).startsWith('..'), `외부 로컬 링크: ${file}`);
      await fs.access(target);
      links++;
    }
    assert(!content.includes('.local/'), `로컬 참고 자료를 배포 스킬이 읽으면 안 됩니다: ${file}`);
  }
}
await check(path.join(root, 'skills'));
process.stdout.write(`${skills}개 스킬, ${links}개 로컬 링크 확인\n`);
