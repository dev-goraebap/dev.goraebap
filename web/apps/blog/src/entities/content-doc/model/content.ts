import type { ComponentType } from "react";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import type { MaturityStatus } from "@/shared/lib/maturity";

// 지침 글의 원본(content/)을 읽는다. 문서가 든 폴더가 그 문서의 메뉴이고, SKILL.md가 있는 폴더가 스킬 하나다.
// 주소는 content 경로를 따른다: reference/frontend/<묶음>/<문서>, design-system/<문서>, design-system/components/<컴포넌트>.
// 문서는 공통 글(<문서>.mdx 또는 <문서>/index.mdx)과, 스택마다 다른 자리를 채우는 스택 파일(<문서>/<스택>.mdx)로 이뤄진다.

interface ContentMeta {
  title?: string;
  icon?: SystemIconName;
  group?: string;
  order?: number;
  summary?: string;
  // Blog 글의 날짜(yyyy-mm-dd)와 썸네일 경로
  date?: string;
  thumbnail?: string;
  // 작성자 성숙도 메타데이터
  maturity?: MaturityStatus;
  maturityNote?: string;
  reviewedAt?: string | Date;
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

// 스택 갈래마다 고를 수 있는 스택. 하나뿐인 갈래는 선택기를 숨긴다.
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

// 메뉴가 어느 스택 갈래인지: Reference는 둘째 마디(frontend·backend), 디자인 시스템과 그 밖의 frontend 메뉴는 frontend다.
export function stackSpace(menu: string): Space {
  const [first, second] = menu.split("/");
  if (first === "reference") return second === "backend" ? "backend" : "frontend";
  return first === "backend" ? "backend" : "frontend";
}

// 하위 폴더를 묶음으로 나눠 한 사이드바로 보이는 메뉴(섹션). 묶음은 이 순서로 보인다.
export const SECTION_GROUPS: Record<string, readonly { id: string; title: string }[]> = {};

// SKILL.md를 사이트에서 보이는 문서의 주소 이름
export const SKILL_SLUG = "ai";

export interface ContentDoc {
  // content 기준 메뉴 경로(문서가 든 폴더). 예: reference/frontend/routing
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

// 섹션 하나의 문서를 사이드바 순서로: 섹션 바로 아래 문서, 묶음 순서대로 묶음 문서, 맨 끝에 AI 지침.
export function sectionDocs(root: string) {
  const top = menuDocs(root);
  const grouped = (SECTION_GROUPS[root] ?? []).flatMap((group) =>
    menuDocs(`${root}/${group.id}`).filter((doc) => !doc.isSkill),
  );
  return [...top.filter((doc) => !doc.isSkill), ...grouped, ...top.filter((doc) => doc.isSkill)];
}

// Blog 글은 스택이 없어서 주소 끝에 스택을 붙이지 않는다(/blog/<글>).
export const BLOG_MENU = "blog";
const isStackless = (menu: string) => menu === BLOG_MENU;

export const stacksOf = (menu: string): readonly string[] =>
  isStackless(menu) ? [] : SPACE_STACKS[stackSpace(menu)];
export const menuRoutePrefix = (menu: string) =>
  isStackless(menu) ? `/${menu}` : `/webapp/${menu}`;
// 스택을 모르면(스택 없는 Blog 글에서 거는 링크 등) 스택 없는 주소를 돌려준다. 그 주소는 독자가 고른 스택으로 다시 보낸다.
export const docHref = (doc: ContentDoc, stack: string) =>
  isStackless(doc.menu) || !stack
    ? `${menuRoutePrefix(doc.menu)}/${doc.slug}`
    : `${menuRoutePrefix(doc.menu)}/${doc.slug}/${stack}`;

// Blog 글을 날짜가 늦은 것부터.
export const blogPosts = () =>
  menuDocs(BLOG_MENU).sort((a, b) => (b.meta.date ?? "").localeCompare(a.meta.date ?? ""));

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
