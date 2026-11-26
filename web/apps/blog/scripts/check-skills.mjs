// 사이트 문서와 Webapp 플러그인 지침의 짝을 확인한다.
// 페이지 연결표의 skills 경로가 실제 지침을 가리키는지 보고, 어느 페이지에도 보이지 않는 예시를 알려 준다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = fileURLToPath(new URL("../", import.meta.url));
const skillsDir = path.resolve(app, "../../../plugins/webapp/skills");
// 문서가 옮긴 지침: content 밖의 페이지 연결표
const catalog = fs.readFileSync(
  path.join(app, "src/entities/code-example/model/page-skills.ts"),
  "utf8",
);

const errors = [];
const used = new Set();
for (const [, list] of catalog.matchAll(/^\s*skills: \[([^\]]*)\],?$/gm)) {
  for (const [, file] of list.matchAll(/"([^"]+)"/g)) {
    used.add(file);
    if (!fs.existsSync(path.join(skillsDir, file))) errors.push(`없는 지침을 가리킵니다: ${file}`);
  }
}
// 예시 파일은 첫 문단이 링크한 지침을 옮긴 사이트 문서에 보인다. 어느 문서에도 보이지 않는 예시는 알려만 준다.
const hidden = [];
let exampleCount = 0;
for (const skill of fs.readdirSync(skillsDir)) {
  const dir = path.join(skillsDir, skill, "examples");
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).filter((name) => name.endsWith(".md"))) {
    exampleCount++;
    const intro = fs
      .readFileSync(path.join(dir, name), "utf8")
      .replace(/\r\n/g, "\n")
      .split(/^## /m)[0];
    const rules = [...intro.matchAll(/\]\(((?!https?:)[^)#]+)/g)].map(([, href]) =>
      path.posix.normalize(`${skill}/examples/${href}`),
    );
    if (!rules.some((rule) => used.has(rule))) hidden.push(`${skill}/examples/${name}`);
  }
}

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`지침 ${used.size}개가 사이트 문서와 짝을 이룹니다.\n`);
process.stdout.write(
  `예시 ${exampleCount}개 중 ${exampleCount - hidden.length}개가 사이트 문서에 보입니다.${hidden.length ? ` 보이지 않는 예시: ${hidden.join(", ")}` : ""}\n`,
);
