import { LAYOUT_DOCS, layoutPage } from "@/entities/layout-doc";
import {
  DIATAXIS_SECTION_LABELS,
  diataxisAllDocs,
  diataxisDocHref,
} from "@/entities/diataxis-doc";
import { blogPosts, docHref, menuDocs, plainText } from "@/entities/content-doc";
import { GLOSSARY_ENTRIES, stripGlossaryMarkup } from "@/shared/lib/glossary";

export const DOC_GROUPS = [
  "Blog",
  "웹 애플리케이션",
  "프론트엔드",
  "백엔드",
  "디자인 시스템",
  "파운데이션",
  "컴포넌트",
  "레이아웃",
  "패턴",
  "용어집",
] as const;

export interface DocEntry {
  id: string;
  title: string;
  group: (typeof DOC_GROUPS)[number];
  href: string;
  hash?: string;
  description: string;
  keywords: string;
}

const MAX_RESULTS = 40;
const SUGGESTED_GROUPS: DocEntry["group"][] = ["디자인 시스템", "파운데이션", "패턴"];

const page = (
  group: DocEntry["group"],
  title: string,
  href: string,
  description: string,
): DocEntry => ({ id: href, group, title, href, description, keywords: description });

const DOC_ENTRIES: DocEntry[] = [
  ...blogPosts().map((doc) => ({
    id: `blog:${doc.slug}`,
    group: "Blog" as const,
    title: doc.meta.title ?? doc.slug,
    href: docHref(doc, ""),
    description: doc.meta.summary ?? "",
    keywords: plainText(doc.source),
  })),
  page("디자인 시스템", "개요", "/webapp/design-system/overview", "디자인 시스템의 구조와 쓰임"),
  ...diataxisAllDocs("webapp").map((doc) => ({
    id: `webapp:${doc.section}/${doc.slug}`,
    group: "웹 애플리케이션" as const,
    title: doc.meta.title ?? doc.slug,
    href: diataxisDocHref(doc),
    description: `${DIATAXIS_SECTION_LABELS[doc.section]} · ${doc.meta.summary ?? ""}`,
    keywords: [doc.source, ...doc.stacks.map((s) => s.source)].map(plainText).join(" "),
  })),
  ...diataxisAllDocs("frontend").map((doc) => ({
    id: `frontend:${doc.section}/${doc.slug}`,
    group: "프론트엔드" as const,
    title: doc.meta.title ?? doc.slug,
    href: diataxisDocHref(doc),
    description: `${DIATAXIS_SECTION_LABELS[doc.section]} · ${doc.meta.summary ?? ""}`,
    keywords: [doc.source, ...doc.stacks.map((s) => s.source)].map(plainText).join(" "),
  })),
  ...diataxisAllDocs("backend").map((doc) => ({
    id: `backend:${doc.section}/${doc.slug}`,
    group: "백엔드" as const,
    title: doc.meta.title ?? doc.slug,
    href: diataxisDocHref(doc),
    description: `${DIATAXIS_SECTION_LABELS[doc.section]} · ${doc.meta.summary ?? ""}`,
    keywords: [doc.source, ...doc.stacks.map((s) => s.source)].map(plainText).join(" "),
  })),
  page("컴포넌트", "컴포넌트 개요", "/webapp/design-system/components", "전체 컴포넌트 목록"),
  ...menuDocs("design-system/components")
    .filter((doc) => !doc.isSkill)
    .map((doc) => ({
      id: `component:${doc.slug}`,
      group: "컴포넌트" as const,
      title: doc.meta.title ?? doc.slug,
      href: `/webapp/design-system/components/${doc.slug}`,
      description: doc.meta.summary ?? "",
      keywords: `${doc.slug} ${doc.meta.group ?? ""} ${plainText(doc.source)}`,
    })),
  page("레이아웃", "레이아웃 개요", "/webapp/design-system/layouts", "앱 외곽과 메인 영역 레이아웃"),
  // 메인 영역 레이아웃은 「페이지 배치」 문서의 절이다. 앱 외곽 레이아웃은 아래 content 문서로 찾는다.
  ...LAYOUT_DOCS.filter((doc) => doc.level === "content").map((doc) => ({
    id: `layout:${doc.id}`,
    group: "레이아웃" as const,
    title: doc.name,
    href: layoutPage(doc.id) ?? "/webapp/design-system/layouts",
    description: doc.summary,
    keywords: `${doc.id} ${doc.summary}`,
  })),
  ...menuDocs("design-system").map((doc) => ({
    id: `design-system:${doc.slug}`,
    // 머리말의 묶음(파운데이션·레이아웃·패턴 등)을 따르고, 플레이북·아티클·AI 지침은 디자인 시스템에 둔다.
    group: ((DOC_GROUPS as readonly string[]).includes(doc.meta.group ?? "")
      ? doc.meta.group
      : "디자인 시스템") as DocEntry["group"],
    title: doc.meta.title ?? doc.slug,
    href: `/webapp/design-system/${doc.slug}`,
    description: doc.meta.summary ?? doc.meta.description ?? "",
    keywords: plainText(doc.source),
  })),
  page(
    "용어집",
    "통합 용어집",
    "/glossary",
    "프론트엔드·백엔드·디자인 시스템 등 문서 전반의 아키텍처·설계 용어 모음",
  ),
  ...GLOSSARY_ENTRIES.map((entry) => ({
    id: `glossary:${entry.domain}:${entry.id}`,
    group: "용어집" as const,
    title: entry.korean ? `${entry.korean} (${entry.term})` : entry.term,
    href: "/glossary",
    hash: entry.id,
    description: `${entry.domainLabel} · ${stripGlossaryMarkup(entry.definition)}`,
    keywords: [
      entry.domainLabel,
      entry.category,
      entry.term,
      entry.korean ?? "",
      stripGlossaryMarkup(entry.definition),
      entry.distinction ?? "",
      ...Object.entries(entry.stacks ?? {}).flat(),
    ].join(" "),
  })),
];

function rank(entry: DocEntry, phrase: string) {
  const title = entry.title.toLowerCase();
  if (title === phrase) return 0;
  if (title.startsWith(phrase)) return 1;
  if (title.includes(phrase)) return 2;
  return 3;
}

export function searchDocs(query: string) {
  const phrase = query.trim().toLowerCase();
  if (!phrase) {
    return DOC_ENTRIES.filter((entry) => !entry.hash && SUGGESTED_GROUPS.includes(entry.group));
  }
  const terms = phrase.split(/\s+/);
  return DOC_ENTRIES.filter((entry) => {
    const text = `${entry.title} ${entry.keywords}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  })
    .map((entry, order) => ({ entry, order, score: rank(entry, phrase) }))
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .slice(0, MAX_RESULTS)
    .map(({ entry }) => entry);
}
