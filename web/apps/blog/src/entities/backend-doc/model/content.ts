import type { ComponentType } from "react";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import type { DocsNavGroup } from "@/shared/ui";

export type BackendSectionId = "playbooks" | "articles" | "reference";

export const BACKEND_SECTIONS: readonly {
  id: BackendSectionId;
  title: string;
  description: string;
}[] = [
  { id: "playbooks", title: "플레이북", description: "목표 하나를 이루는 실행 절차" },
  { id: "articles", title: "아티클", description: "설계 의도와 트레이드오프" },
  { id: "reference", title: "레퍼런스", description: "규칙, 구조, 계약 명세" },
];

export const BACKEND_SECTION_LABELS: Record<BackendSectionId, string> = {
  playbooks: "플레이북",
  articles: "아티클",
  reference: "레퍼런스",
};

export const BACKEND_STACK_LABELS: Record<string, string> = {
  common: "공통",
  springboot: "Spring Boot",
  nestjs: "NestJS",
};

const STACK_ORDER = ["springboot", "nestjs"];

export interface BackendDocMeta {
  title?: string;
  summary?: string;
  order?: number;
  icon?: SystemIconName;
}

export interface BackendContentModule {
  default: ComponentType<{ components?: Record<string, unknown> }>;
  frontmatter?: BackendDocMeta;
}

export interface BackendStackVariant {
  id: string;
  label: string;
  file: string;
  meta: BackendDocMeta;
  module: BackendContentModule;
  source: string;
}

export interface BackendDoc {
  section: BackendSectionId;
  slug: string;
  file: string;
  meta: BackendDocMeta;
  module: BackendContentModule;
  source: string;
  stacks: BackendStackVariant[];
}

const MODULES = import.meta.glob<BackendContentModule>(
  "/content/backend/{playbooks,articles,reference}/**/*.md",
  { eager: true },
);
const SOURCES = import.meta.glob<string>(
  "/content/backend/{playbooks,articles,reference}/**/*.md",
  { query: "?raw", import: "default", eager: true },
);

function stackSort(a: string, b: string) {
  const ia = STACK_ORDER.indexOf(a);
  const ib = STACK_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b);
}

function buildBackendDocs(): BackendDoc[] {
  const folderStacks = new Map<string, BackendStackVariant[]>();

  for (const [file, mod] of Object.entries(MODULES)) {
    const match = /^\/content\/backend\/(playbooks|articles|reference)\/([^/]+)\/([^/]+)\.md$/.exec(
      file,
    );
    if (!match || match[3] === "index") continue;
    const base = `/content/backend/${match[1]}/${match[2]}`;
    const stackId = match[3];
    const list = folderStacks.get(base) ?? [];
    list.push({
      id: stackId,
      label: BACKEND_STACK_LABELS[stackId] ?? stackId,
      file,
      meta: mod.frontmatter ?? {},
      module: mod,
      source: SOURCES[file] ?? "",
    });
    folderStacks.set(base, list);
  }

  const docs: BackendDoc[] = [];
  for (const [file, mod] of Object.entries(MODULES)) {
    const folder = /^\/content\/backend\/(playbooks|articles|reference)\/([^/]+)\/index\.md$/.exec(
      file,
    );
    const single = /^\/content\/backend\/(playbooks|articles|reference)\/([^/]+)\.md$/.exec(file);
    const found = folder ?? single;
    if (!found) continue;
    const section = found[1] as BackendSectionId;
    const slug = found[2];
    const base = `/content/backend/${section}/${slug}`;
    const stacks = folder
      ? [...(folderStacks.get(base) ?? [])].sort((a, b) => stackSort(a.id, b.id))
      : [];
    docs.push({
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

export const BACKEND_DOCS = buildBackendDocs();

export function backendSectionDocs(section: BackendSectionId): BackendDoc[] {
  return BACKEND_DOCS.filter((doc) => doc.section === section).sort(
    (a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99) || a.slug.localeCompare(b.slug),
  );
}

export function backendAllDocs(): BackendDoc[] {
  return BACKEND_SECTIONS.flatMap((section) => backendSectionDocs(section.id));
}

export function findBackendDoc(section: string, slug: string): BackendDoc | undefined {
  return BACKEND_DOCS.find((doc) => doc.section === section && doc.slug === slug);
}

export function backendDocHref(doc: BackendDoc, stack?: string): string {
  const base = `/backend/${doc.section}/${doc.slug}`;
  return stack && stack !== "common" ? `${base}?stack=${encodeURIComponent(stack)}` : base;
}

export function backendNavGroups(): DocsNavGroup[] {
  const groups: DocsNavGroup[] = BACKEND_SECTIONS.map((section) => ({
    title: section.title,
    items: backendSectionDocs(section.id).map((doc) => ({
      label: doc.meta.title ?? doc.slug,
      href: backendDocHref(doc),
      icon: doc.meta.icon,
    })),
  })).filter((group) => group.items.length > 0);

  groups.push({
    items: [
      {
        label: "용어집",
        href: "/backend/glossary",
        icon: "book",
      },
    ],
  });

  return groups;
}

function joinContentPath(fromFile: string, href: string): string {
  const parts = fromFile.split("/").slice(0, -1);
  for (const seg of href.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== "." && seg !== "") parts.push(seg);
  }
  return parts.join("/");
}

export function resolveBackendHref(fromFile: string, href: string): string | undefined {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const [path, anchor] = href.split("#");
  const target = joinContentPath(fromFile, path);
  if (target === "/content/backend/glossary.md") {
    return `/backend/glossary${anchor ? `#${anchor}` : ""}`;
  }
  for (const doc of BACKEND_DOCS) {
    if (doc.file === target) {
      return `${backendDocHref(doc)}${anchor ? `#${anchor}` : ""}`;
    }
    const stack = doc.stacks.find((item) => item.file === target);
    if (stack) {
      return `${backendDocHref(doc, stack.id)}${anchor ? `#${anchor}` : ""}`;
    }
  }
  return undefined;
}
