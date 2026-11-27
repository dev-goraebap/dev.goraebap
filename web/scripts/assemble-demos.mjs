// 각 프레임워크 데모 앱 빌드 산출물을 blog/dist/demos/{react,angular} 아래로 모아 단일 정적 사이트로 배포한다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = fileURLToPath(new URL("../", import.meta.url));
const targetRoot = path.join(web, "apps/blog/dist/demos");

const SOURCES = [
  {
    name: "react",
    from: path.join(web, "apps/react-tanstack-demo/dist"),
    to: path.join(targetRoot, "react"),
  },
  {
    name: "angular",
    from: path.join(web, "apps/angular-demo/dist/angular-demo/browser"),
    to: path.join(targetRoot, "angular"),
  },
];

fs.mkdirSync(targetRoot, { recursive: true });

for (const entry of SOURCES) {
  if (!fs.existsSync(entry.from)) {
    console.warn(`[assemble-demos] 건너뜀(${entry.name}): 빌드 폴더가 없습니다 (${entry.from})`);
    continue;
  }
  fs.rmSync(entry.to, { recursive: true, force: true });
  fs.cpSync(entry.from, entry.to, { recursive: true });
  console.log(`[assemble-demos] ${entry.name} → ${path.relative(web, entry.to)}`);
}
