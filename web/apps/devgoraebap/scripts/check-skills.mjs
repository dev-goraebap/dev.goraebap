// 사이트 문서와 Webapp 플러그인 지침의 짝을 확인한다.
// 문서의 skills 경로가 실제 지침을 가리키는지, 사이트가 옮겨 쓰기로 한 스킬의 참고 자료가 모두 어느 문서엔가 쓰였는지 본다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = fileURLToPath(new URL("../", import.meta.url));
const skillsDir = path.resolve(app, "../../../plugins/webapp/skills");
// 문서가 옮긴 지침: Engineering 문서와, 그 밖의 페이지 연결표
const catalog = [
  "src/entities/webapp-doc/model/catalog.ts",
  "src/entities/code-example/model/page-skills.ts",
]
  .map((file) => fs.readFileSync(path.join(app, file), "utf8"))
  .join("\n");

// 문서로 옮긴 스킬과, 아직 옮기지 않은 참고 자료(이유와 함께)
// frontend-engineering은 content가 원본이라 이 짝 검사가 필요 없다(플러그인 변환기가 링크를 확인한다).
const COVERED_SKILLS = ["backend-engineering"];
const NOT_YET = {
  "backend-engineering/references/untrusted-content.md":
    "사용자가 올린 HTML과 고른 주소. 사이트 글 미작성",
};

const errors = [];
const used = new Set();
for (const [, list] of catalog.matchAll(/^\s*skills: \[([^\]]*)\],?$/gm)) {
  for (const [, file] of list.matchAll(/"([^"]+)"/g)) {
    used.add(file);
    if (!fs.existsSync(path.join(skillsDir, file))) errors.push(`없는 지침을 가리킵니다: ${file}`);
  }
}
for (const skill of COVERED_SKILLS) {
  const refs = path.join(skillsDir, skill, "references");
  for (const name of fs.readdirSync(refs).filter((name) => name.endsWith(".md"))) {
    const file = `${skill}/references/${name}`;
    if (!used.has(file) && !NOT_YET[file])
      errors.push(`사이트 문서가 옮기지 않은 지침입니다: ${file}`);
  }
}
for (const file of Object.keys(NOT_YET)) {
  if (used.has(file)) errors.push(`이미 문서가 있으니 NOT_YET에서 지웁니다: ${file}`);
}

// 사이트 플레이북과 goraebap-mode 플레이북은 1:1이다.
const playbooks = fs.readFileSync(
  path.join(app, "src/entities/playbook/model/playbooks.ts"),
  "utf8",
);
const sitePlaybooks = [...playbooks.matchAll(/skill: `\$\{PLAYBOOK\}([a-z-]+\.md)`/g)].map(
  ([, name]) => name,
);
const pluginPlaybooks = fs
  .readdirSync(path.join(skillsDir, "goraebap-mode/playbooks"))
  .filter((name) => name.endsWith(".md"));
for (const name of sitePlaybooks)
  if (!pluginPlaybooks.includes(name)) errors.push(`플러그인에 없는 플레이북입니다: ${name}`);
for (const name of pluginPlaybooks)
  if (!sitePlaybooks.includes(name)) errors.push(`사이트에 없는 플레이북입니다: ${name}`);

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
process.stdout.write(
  `지침 ${used.size}개와 플레이북 ${sitePlaybooks.length}개가 사이트 문서와 짝을 이룹니다. 아직 옮기지 않은 지침 ${Object.keys(NOT_YET).length}개\n`,
);
process.stdout.write(
  `예시 ${exampleCount}개 중 ${exampleCount - hidden.length}개가 사이트 문서에 보입니다.${hidden.length ? ` 보이지 않는 예시: ${hidden.join(", ")}` : ""}\n`,
);
