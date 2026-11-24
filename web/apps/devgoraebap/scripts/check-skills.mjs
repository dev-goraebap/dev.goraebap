// 사이트 문서와 Webapp 플러그인 지침의 짝을 확인한다.
// 문서의 skills 경로가 실제 지침을 가리키는지, 사이트가 옮겨 쓰기로 한 스킬의 참고 자료가 모두 어느 문서엔가 쓰였는지 본다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = fileURLToPath(new URL("../", import.meta.url));
const skillsDir = path.resolve(app, "../../../plugins/webapp/skills");
const catalog = fs.readFileSync(path.join(app, "src/entities/webapp-doc/model/catalog.ts"), "utf8");

// 문서로 옮긴 스킬과, 아직 옮기지 않은 참고 자료(이유와 함께)
const COVERED_SKILLS = ["frontend-engineering", "backend-engineering"];
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

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(
  `지침 ${used.size}개가 사이트 문서와 짝을 이룹니다. 아직 옮기지 않은 지침 ${Object.keys(NOT_YET).length}개\n`,
);
