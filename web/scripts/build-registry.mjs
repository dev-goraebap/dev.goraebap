// 디자인 시스템 레지스트리를 만든다. 사이트 빌드 때 돌아 apps/blog/public/r에 JSON을 남긴다.
// 프로젝트는 필요한 파일을 고르지 않고 스타일 레시피 전체(design-system)와 자기 프레임워크의 어댑터 전체를 받는다.
// 받은 파일은 src/shared/ui/goraebap/ 아래에 두며, 패키지 이름 import는 그 안의 상대 경로로 바꿔 별칭 설정 없이 쓰게 한다.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(web, "apps/blog/public/r");
const SITE = "https://dev.goraebap.xyz/r";
const REPO = "https://github.com/dev-goraebap/dev.goraebap";
const TARGET = "src/shared/ui/goraebap";
const catalog = Object.fromEntries(
  [
    ...fs
      .readFileSync(path.join(web, "pnpm-workspace.yaml"), "utf8")
      .matchAll(/^ {2}"?([^":\s]+)"?: "([^"]+)"$/gm),
  ].map(([, name, version]) => [name, version]),
);
const commit = (() => {
  try {
    return execSync("git rev-parse HEAD", { cwd: web }).toString().trim();
  } catch {
    return "unknown";
  }
})();

const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );

// 원본 패키지 안 경로 → 받는 쪽 경로(TARGET 기준)
const ITEMS = [
  {
    name: "design-system",
    title: "스타일 레시피",
    description: "테마 CSS, cn, 모든 컴포넌트 레시피. React·Angular 어댑터가 함께 쓴다.",
    root: "packages/design-system/src",
    place: (file) => (file === "lib/cn.ts" ? "design-system/cn.ts" : `design-system/${file}`),
    dependencies: ["clsx", "tailwind-merge", "tailwind-variants", "tw-animate-css"],
    registryDependencies: [],
  },
  {
    name: "ui-react",
    title: "React 어댑터",
    description: "Base UI 위에 레시피를 입힌 React 컴포넌트 전체",
    root: "packages/ui-react/src",
    place: (file) => `react/${file}`,
    dependencies: ["@base-ui/react", "cmdk", "lucide-react", "react-day-picker"],
    registryDependencies: [`${SITE}/design-system.json`],
  },
  {
    name: "ui-angular",
    title: "Angular 어댑터",
    description: "Angular Aria·CDK 위에 레시피를 입힌 Angular 디렉티브·컴포넌트 전체",
    root: "packages/ui-angular/src",
    place: (file) => `angular/${file}`,
    dependencies: ["@angular/aria", "@angular/cdk"],
    registryDependencies: [`${SITE}/design-system.json`],
  },
];

// @goraebap/design-system/<경로>를 받는 쪽의 상대 경로로 바꾼다.
function rewrite(content, placedAt) {
  const from = path.posix.dirname(placedAt);
  const to = (target) => {
    const relative = path.posix.relative(from, target);
    return relative.startsWith(".") ? relative : `./${relative}`;
  };
  return content
    .replace(/(["'])@goraebap\/design-system\/cn\1/g, (_, q) => `${q}${to("design-system/cn")}${q}`)
    .replace(
      /(["'])@goraebap\/design-system\/recipes\/([\w-]+)\1/g,
      (_, q, name) => `${q}${to(`design-system/recipes/${name}`)}${q}`,
    )
    .replace(
      /(["'])@goraebap\/design-system\/styles\/([\w.-]+)\1/g,
      (_, q, name) => `${q}${to(`design-system/styles/${name}`)}${q}`,
    );
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const index = [];
for (const item of ITEMS) {
  const root = path.join(web, item.root);
  const files = walk(root)
    .filter((file) => /\.(tsx?|css)$/.test(file))
    .map((file) => {
      const source = path.relative(root, file).split(path.sep).join("/");
      const placed = item.place(source);
      return {
        path: `${item.root}/${source}`,
        type: "registry:file",
        target: `${TARGET}/${placed}`,
        content: rewrite(fs.readFileSync(file, "utf8"), placed),
      };
    });
  // 받은 판을 비교할 수 있게 원본 커밋을 함께 둔다.
  const folder = item.name === "design-system" ? "design-system" : item.name.replace("ui-", "");
  files.push({
    path: `registry/${item.name}.json`,
    type: "registry:file",
    target: `${TARGET}/${folder}/goraebap-ui.json`,
    content: `${JSON.stringify({ item: item.name, source: REPO, commit, registry: `${SITE}/${item.name}.json` }, null, 2)}\n`,
  });
  const entry = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: "registry:lib",
    title: item.title,
    description: item.description,
    dependencies: item.dependencies.map((name) =>
      catalog[name] ? `${name}@${catalog[name]}` : name,
    ),
    registryDependencies: item.registryDependencies,
    files,
  };
  fs.writeFileSync(path.join(out, `${item.name}.json`), `${JSON.stringify(entry, null, 2)}\n`);
  index.push({
    name: item.name,
    type: entry.type,
    title: item.title,
    description: item.description,
    files: files.length,
  });
}
fs.writeFileSync(
  path.join(out, "registry.json"),
  `${JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", name: "goraebap", homepage: "https://dev.goraebap.xyz", commit, items: index }, null, 2)}\n`,
);
console.log(
  `registry: ${index.map((entry) => `${entry.name} ${entry.files}`).join(", ")} (${commit.slice(0, 7)})`,
);
