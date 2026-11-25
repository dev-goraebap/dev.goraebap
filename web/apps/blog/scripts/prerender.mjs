// 지침 글(content) 페이지를 스택마다 정적 HTML로 만든다. vite build와 서버용 빌드(--ssr) 뒤에 실행한다.
// 나머지 주소는 지금처럼 index.html 하나를 브라우저가 그린다.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const app = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(app, "dist");
const server = path.join(app, "dist-server");
const { render, routes } = await import(pathToFileURL(path.join(server, "entry-server.js")).href);
const template = await fs.readFile(path.join(dist, "index.html"), "utf8");
if (!template.includes("<!--app-->")) throw new Error("index.html에 <!--app--> 자리가 없습니다.");

let count = 0;
for (const url of routes()) {
  const body = await render(url);
  // 서버 렌더링이 실패하면 React가 오류와 스택(로컬 경로 포함)을 HTML에 남기고 브라우저 렌더링으로 넘긴다. 그런 페이지는 내보내지 않는다.
  if (body.includes("Switched to client rendering") || !body.includes("<article"))
    throw new Error(`정적 페이지를 그리지 못했습니다: ${url}
${/data-msg="([^"]*)"/.exec(body)?.[1] ?? ""}`);
  const html = template.replace("<!--app-->", body);
  const out = path.join(dist, url, "index.html");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, html);
  count++;
}
await fs.rm(server, { recursive: true, force: true });
process.stdout.write(`정적 페이지 ${count}개\n`);
