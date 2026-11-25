import type { ComponentType } from "react";
import type { SystemIconName } from "@goraebap/ui-react/icons";

// 지침 글의 원본(content/)을 읽는다. 폴더 하나가 메뉴 하나이고, SKILL.md가 있는 폴더가 스킬 하나다.
// 문서는 공통 글(<문서>.mdx 또는 <문서>/index.mdx)과, 스택마다 다른 자리를 채우는 스택 파일(<문서>/<스택>.mdx)로 이뤄진다.

interface ContentMeta {
  title?: string;
  icon?: SystemIconName;
  group?: string;
  order?: number;
  summary?: string;
  // SKILL.md 머리말
  name?: string;
  description?: string;
}

export interface ContentModule {
  default: ComponentType<{ components?: Record<string, unknown> }>;
  frontmatter?: ContentMeta;
}

const MODULES = import.meta.glob<ContentModule>(["/content/**/*.mdx", "/content/**/SKILL.md"], {
  eager: true,
});
const SOURCES = import.meta.glob<string>(["/content/**/*.mdx", "/content/**/SKILL.md"], {
  query: "?raw",
  import: "default",
  eager: true,
});

// 공간마다 고를 수 있는 스택. 하나뿐인 공간은 선택기를 숨긴다.
const SPACE_STACKS = {
  frontend: ["react", "angular"],
  backend: ["spring"],
} as const satisfies Record<string, readonly string[]>;

export type Space = keyof typeof SPACE_STACKS;

export const STACK_LABELS: Record<string, string> = {
  react: "React",
  angular: "Angular",
  spring: "Spring",
};

// SKILL.md를 사이트에서 보이는 문서의 주소 이름
export const SKILL_SLUG = "ai";

export interface ContentDoc {
  // content 기준 메뉴 경로. 예: frontend/engineering
  menu: string;
  slug: string;
  // 공통 글 파일(/content/...)
  file: string;
  meta: ContentMeta;
  isSkill: boolean;
  module: ContentModule;
  // 스택 id → 스택 파일
  stacks: Record<string, { file: string; module: ContentModule }>;
  source: string;
}

function build() {
  const docs: ContentDoc[] = [];
  const stackFiles = new Map<string, Record<string, { file: string; module: ContentModule }>>();
  const stackIds = new Set<string>(Object.values(SPACE_STACKS).flat());

  for (const [file, module] of Object.entries(MODULES)) {
    const match = /^\/content\/(.+)\/([^/]+)\.mdx$/.exec(file);
    if (!match || !stackIds.has(match[2])) continue;
    const base = `/content/${match[1]}`;
    stackFiles.set(base, { ...stackFiles.get(base), [match[2]]: { file, module } });
  }

  for (const [file, module] of Object.entries(MODULES)) {
    const skill = /^\/content\/(.+)\/SKILL\.md$/.exec(file);
    if (skill) {
      docs.push({
        menu: skill[1],
        slug: SKILL_SLUG,
        file,
        meta: { ...module.frontmatter, title: "AI 지침" },
        isSkill: true,
        module,
        stacks: {},
        source: SOURCES[file],
      });
      continue;
    }
    const folder = /^\/content\/(.+)\/([^/]+)\/index\.mdx$/.exec(file);
    const single = /^\/content\/(.+)\/([^/]+)\.mdx$/.exec(file);
    const found = folder ?? (single && !stackIds.has(single[2]) ? single : null);
    if (!found) continue;
    docs.push({
      menu: found[1],
      slug: found[2],
      file,
      meta: module.frontmatter ?? {},
      isSkill: false,
      module,
      stacks: folder ? (stackFiles.get(`/content/${found[1]}/${found[2]}`) ?? {}) : {},
      source: SOURCES[file],
    });
  }
  return docs;
}

export const CONTENT_DOCS = build();

// 메뉴 하나의 문서를 사이드바 순서로. SKILL.md는 맨 끝에 둔다.
export function menuDocs(menu: string) {
  return CONTENT_DOCS.filter((doc) => doc.menu === menu).sort(
    (a, b) => Number(a.isSkill) - Number(b.isSkill) || (a.meta.order ?? 99) - (b.meta.order ?? 99),
  );
}

export function findDocByFile(file: string) {
  return CONTENT_DOCS.find(
    (doc) => doc.file === file || Object.values(doc.stacks).some((stack) => stack.file === file),
  );
}

const spaceOf = (menu: string) => menu.split("/")[0] as Space;
export const stacksOf = (menu: string): readonly string[] => SPACE_STACKS[spaceOf(menu)] ?? [];
export const docHref = (doc: ContentDoc, stack: string) => `/${doc.menu}/${doc.slug}/${stack}`;

// 검색용 본문: 머리말·JSX 표시·마크다운 기호를 걷어 낸 글
export function plainText(source: string) {
  return source
    .replace(/^---[\s\S]*?---/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<\/?[A-Z][^>]*>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`|>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
