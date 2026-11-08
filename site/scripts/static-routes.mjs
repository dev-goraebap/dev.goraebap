import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { siteDocuments } from '../content-plugin.ts';

const output = fileURLToPath(new URL('../dist/', import.meta.url));
const template = await readFile(path.join(output, 'index.html'), 'utf8');
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const docs = siteDocuments();
const routes = [{ path: '/blog/', title: '모든 글' }, { path: '/settings/appearance/', title: '화면 설정' }, { path: '/settings/plugins/', title: '플러그인 설정' }, ...docs];
for (const doc of routes) {
  const destination = path.resolve(output, `.${doc.path}`);
  if (!destination.startsWith(`${path.resolve(output)}${path.sep}`)) throw new Error(`사이트 밖 경로: ${doc.path}`);
  await mkdir(destination, { recursive: true });
  const html = template.replace(/<title>.*?<\/title>/, `<title>${escape(doc.title)} · dev-goraebap</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escape(doc.description ?? doc.title)}" />`);
  await writeFile(path.join(destination, 'index.html'), html);
}
// 직접 연 옛 주소도 같은 라우터로 연결한다. 알 수 없는 주소는 HTTP 404를 유지한다.
for (const doc of docs) {
  const legacy = doc.path.startsWith('/blog/') ? doc.path.replace('/blog/', '/posts/') : doc.path.replace('/webcraft/', '/').replace('/webcraft-mode/', '/goraebap-mode/');
  if (legacy === '/') continue;
  const directory = path.resolve(output, `.${legacy}`);
  if (!directory.startsWith(`${path.resolve(output)}${path.sep}`)) throw new Error(`사이트 밖 경로: ${legacy}`);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), template);
}
await writeFile(path.join(output, '404.html'), template);
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(doc => `<url><loc>https://goraebap.xyz${escape(doc.path)}</loc></url>`).join('')}</urlset>\n`);
await writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /sample.html\nSitemap: https://goraebap.xyz/sitemap.xml\n');
console.log(`${routes.length}개 사이트 주소와 호환 주소 생성`);
