import type { ComponentType } from "react";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import type { MaturityStatus } from "@/shared/lib/maturity";
import type { DocsNavGroup } from "@/shared/ui";

export type DiataxisSpace = "backend" | "frontend" | "webapp";

export type DiataxisSectionId = "tutorials" | "playbooks" | "articles" | "reference";

export const DIATAXIS_SECTIONS: readonly {
  id: DiataxisSectionId;
  title: string;
  description: string;
}[] = [
  { id: "tutorials", title: "튜토리얼", description: "처음 시작하는 단계별 안내" },
  { id: "playbooks", title: "플레이북", description: "목표 하나를 이루는 실행 절차" },
  { id: "articles", title: "아티클", description: "설계 의도와 트레이드오프" },
  { id: "reference", title: "레퍼런스", description: "규칙, 구조, 계약 명세" },
];

export const DIATAXIS_SECTION_LABELS: Record<DiataxisSectionId, string> = {
  tutorials: "튜토리얼",
  playbooks: "플레이북",
  articles: "아티클",
  reference: "레퍼런스",
};

export const DIATAXIS_SPACE_LABELS: Record<DiataxisSpace, string> = {
  backend: "백엔드",
  frontend: "프론트엔드",
  webapp: "웹 애플리케이션",
};

export const DIATAXIS_STACK_LABELS: Record<string, string> = {
  common: "공통",
  springboot: "Spring Boot",
  nestjs: "NestJS",
  "react-tanstack": "React · TanStack",
  react: "React",
  angular: "Angular",
  nextjs: "Next.js",
};

const STACK_ORDER = ["springboot", "nestjs", "react-tanstack", "react", "angular", "nextjs"];

export interface DiataxisDocMeta {
  title?: string;
  summary?: string;
  order?: number;
  icon?: SystemIconName;
  date?: string;
  thumbnail?: string;
  maturity?: MaturityStatus;
  maturityNote?: string;
  reviewedAt?: string | Date;
}

export interface DiataxisContentModule {
  default: ComponentType<{ components?: Record<string, unknown> }>;
  frontmatter?: DiataxisDocMeta;
}

export interface DiataxisStackVariant {
  id: string;
  label: string;
  file: string;
  meta: DiataxisDocMeta;
  module: DiataxisContentModule;
  source: string;
}

export interface DiataxisDoc {
  space: DiataxisSpace;
  section: DiataxisSectionId;
  slug: string;
  file: string;
  meta: DiataxisDocMeta;
  module: DiataxisContentModule;
  source: string;
  stacks: DiataxisStackVariant[];
}

const MODULES = import.meta.glob<DiataxisContentModule>(
  "/content/{backend,frontend,webapp}/{tutorials,playbooks,articles,reference}/**/*.md",
  { eager: true },
);
const SOURCES = import.meta.glob<string>(
  "/content/{backend,frontend,webapp}/{tutorials,playbooks,articles,reference}/**/*.md",
  { query: "?raw", import: "default", eager: true },
);

function stackSort(a: string, b: string) {
  const ia = STACK_ORDER.indexOf(a);
  const ib = STACK_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b);
}

function buildDocs(): DiataxisDoc[] {
  const folderStacks = new Map<string, DiataxisStackVariant[]>();

  for (const [file, mod] of Object.entries(MODULES)) {
    const match =
      /^\/content\/(backend|frontend|webapp)\/(tutorials|playbooks|articles|reference)\/([^/]+)\/([^/]+)\.md$/.exec(
        file,
      );
    if (!match || match[4] === "index") continue;
    const base = `/content/${match[1]}/${match[2]}/${match[3]}`;
    const stackId = match[4];
    const list = folderStacks.get(base) ?? [];
    list.push({
      id: stackId,
      label: DIATAXIS_STACK_LABELS[stackId] ?? stackId,
      file,
      meta: mod.frontmatter ?? {},
      module: mod,
      source: SOURCES[file] ?? "",
    });
    folderStacks.set(base, list);
  }

  const docs: DiataxisDoc[] = [];
  for (const [file, mod] of Object.entries(MODULES)) {
    const folder =
      /^\/content\/(backend|frontend|webapp)\/(tutorials|playbooks|articles|reference)\/([^/]+)\/index\.md$/.exec(
        file,
      );
    const single =
      /^\/content\/(backend|frontend|webapp)\/(tutorials|playbooks|articles|reference)\/([^/]+)\.md$/.exec(
        file,
      );
    const found = folder ?? single;
    if (!found) continue;
    const space = found[1] as DiataxisSpace;
    const section = found[2] as DiataxisSectionId;
    const slug = found[3];
    const base = `/content/${space}/${section}/${slug}`;
    const stacks = folder
      ? [...(folderStacks.get(base) ?? [])].sort((a, b) => stackSort(a.id, b.id))
      : [];
    docs.push({
      space,
      section,
      slug,
      file,
      meta: mod.frontmatter ?? {},
      module: mod,
      source: SOURCES[file] ?? "",
      stacks,
    });
  }

  return docs;
}

export const DIATAXIS_DOCS = buildDocs();

export function diataxisSectionDocs(space: DiataxisSpace, section: DiataxisSectionId): DiataxisDoc[] {
  return DIATAXIS_DOCS.filter((doc) => doc.space === space && doc.section === section).sort(
    (a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99) || a.slug.localeCompare(b.slug),
  );
}

export function diataxisAllDocs(space: DiataxisSpace): DiataxisDoc[] {
  return DIATAXIS_SECTIONS.flatMap((section) => diataxisSectionDocs(space, section.id));
}

export function findDiataxisDoc(
  space: DiataxisSpace,
  section: string,
  slug: string,
): DiataxisDoc | undefined {
  return DIATAXIS_DOCS.find(
    (doc) => doc.space === space && doc.section === section && doc.slug === slug,
  );
}

export function diataxisDocHref(doc: DiataxisDoc, stack?: string): string {
  const base =
    doc.space === "webapp"
      ? `/webapp/${doc.section}/${doc.slug}`
      : `/webapp/${doc.space}/${doc.section}/${doc.slug}`;
  return stack && stack !== "common" ? `${base}?stack=${encodeURIComponent(stack)}` : base;
}

export function diataxisNavGroups(space: DiataxisSpace): DocsNavGroup[] {
  return DIATAXIS_SECTIONS.map((section) => ({
    title: section.title,
    items: diataxisSectionDocs(space, section.id).map((doc) => ({
      label: doc.meta.title ?? doc.slug,
      href: diataxisDocHref(doc),
      icon: doc.meta.icon,
    })),
  })).filter((group) => group.items.length > 0);
}

function joinContentPath(fromFile: string, href: string): string {
  const parts = fromFile.split("/").slice(0, -1);
  for (const seg of href.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== "." && seg !== "") parts.push(seg);
  }
  return parts.join("/");
}

export function resolveDiataxisHref(fromFile: string, href: string): string | undefined {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  if (href.startsWith("/")) return href;
  const [path, anchor] = href.split("#");
  const target = joinContentPath(fromFile, path);
  if (/^\/content\/(?:(backend|frontend)\/glossary|glossary\/[^/]+)\.md$/.test(target)) {
    return `/glossary${anchor ? `#${anchor}` : ""}`;
  }
  const designSystem = /^\/content\/design-system\/(.+?)(?:\/index)?\.mdx$/.exec(target);
  if (designSystem) {
    return `/webapp/design-system/${designSystem[1]}${anchor ? `#${anchor}` : ""}`;
  }
  if (target === "/content/design-system/SKILL.md") {
    return `/webapp/design-system/overview${anchor ? `#${anchor}` : ""}`;
  }
  for (const doc of DIATAXIS_DOCS) {
    if (doc.file === target) {
      return `${diataxisDocHref(doc)}${anchor ? `#${anchor}` : ""}`;
    }
    const stack = doc.stacks.find((item) => item.file === target);
    if (stack) {
      return `${diataxisDocHref(doc, stack.id)}${anchor ? `#${anchor}` : ""}`;
    }
  }
  return undefined;
}
