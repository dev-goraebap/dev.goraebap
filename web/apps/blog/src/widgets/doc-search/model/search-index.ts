import { COMPONENT_DOCS } from "@/entities/component-doc";
import { LAYOUT_DOCS, layoutPage } from "@/entities/layout-doc";
import { BACKEND_ENGINEERING_DOCS, type GuideDoc } from "@/entities/webapp-doc";
import { menuDocs, plainText } from "@/entities/content-doc";
import { PLAYBOOKS } from "@/entities/playbook";
import { GLOSSARY, stripGlossaryMarkup } from "@/shared/lib/glossary";

export const DOC_GROUPS = [
  "Playbook",
  "Engineering",
  "디자인 시스템",
  "파운데이션",
  "컴포넌트",
  "레이아웃",
  "패턴",
  "Interaction",
  "Agents",
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
const SUGGESTED_GROUPS: DocEntry["group"][] = [
  "디자인 시스템",
  "파운데이션",
  "Interaction",
  "Agents",
];

const page = (
  group: DocEntry["group"],
  title: string,
  href: string,
  description: string,
): DocEntry => ({ id: href, group, title, href, description, keywords: description });

// 본문까지 검색되도록 섹션의 글을 모두 키워드에 넣는다.
const guideKeywords = (doc: GuideDoc & { group?: string; phase?: string }) =>
  `${doc.slug} ${doc.group ?? doc.phase ?? ""} ${doc.summary} ${doc.sections
    .map((section) =>
      [
        section.title ?? "",
        ...section.paragraphs,
        ...(section.bullets?.items ?? []),
        section.callout?.title ?? "",
        section.callout?.body ?? "",
      ].join(" "),
    )
    .join(" ")}`;

const DOC_ENTRIES: DocEntry[] = [
  page("Playbook", "플레이북 개요", "/playbook", "자주 하는 일의 절차와 스킬 조합"),
  ...PLAYBOOKS.map((playbook) => ({
    id: `playbook:${playbook.slug}`,
    group: "Playbook" as const,
    title: playbook.title,
    href: `/playbook/${playbook.slug}`,
    description: playbook.summary,
    keywords: `${guideKeywords(playbook)} ${playbook.steps.map((step) => `${step.title} ${step.detail} ${step.skills.join(" ")}`).join(" ")}`,
  })),
  page("디자인 시스템", "개요", "/frontend/design-system/overview", "디자인 시스템의 구조와 쓰임"),
  // 스택 없는 주소로 걸어 두면 고른 스택의 페이지로 열린다.
  ...menuDocs("frontend/engineering").map((doc) => ({
    id: `frontend:${doc.slug}`,
    group: "Engineering" as const,
    title: `프론트엔드 ${doc.meta.title ?? doc.slug}`,
    href: `/frontend/engineering/${doc.slug}`,
    description: doc.meta.summary ?? doc.meta.description ?? "",
    keywords: plainText(doc.source),
  })),
  ...BACKEND_ENGINEERING_DOCS.map((doc) => ({
    id: `backend:${doc.slug}`,
    group: "Engineering" as const,
    title: `백엔드 ${doc.title}`,
    href: `/backend/engineering/${doc.slug}`,
    description: doc.summary,
    keywords: guideKeywords(doc),
  })),
  page("컴포넌트", "컴포넌트 개요", "/frontend/design-system/components", "전체 컴포넌트 목록"),
  ...COMPONENT_DOCS.map((doc) => ({
    id: `component:${doc.slug}`,
    group: "컴포넌트" as const,
    title: doc.name,
    href: `/frontend/design-system/components/${doc.slug}`,
    description: stripGlossaryMarkup(doc.summary),
    keywords: `${doc.slug} ${doc.category} ${stripGlossaryMarkup(doc.summary)}`,
  })),
  page(
    "레이아웃",
    "레이아웃 개요",
    "/frontend/design-system/layouts",
    "앱 외곽과 메인 영역 레이아웃",
  ),
  // 메인 영역 레이아웃은 「페이지 배치」 문서의 절이다. 앱 외곽 레이아웃은 아래 content 문서로 찾는다.
  ...LAYOUT_DOCS.filter((doc) => doc.level === "content").map((doc) => ({
    id: `layout:${doc.id}`,
    group: "레이아웃" as const,
    title: doc.name,
    href: layoutPage(doc.id) ?? "/frontend/design-system/layouts",
    description: doc.summary,
    keywords: `${doc.id} ${doc.summary}`,
  })),
  ...menuDocs("frontend/design-system").map((doc) => ({
    id: `design-system:${doc.slug}`,
    // 머리말의 묶음(파운데이션·레이아웃·패턴 등)을 따르고, 검색 묶음에 없는 것(AI 지침 등)은 패턴에 둔다.
    group: ((DOC_GROUPS as readonly string[]).includes(doc.meta.group ?? "") ? doc.meta.group : "패턴") as DocEntry["group"],
    title: doc.meta.title ?? doc.slug,
    href: `/frontend/design-system/${doc.slug}`,
    description: doc.meta.summary ?? doc.meta.description ?? "",
    keywords: plainText(doc.source),
  })),
  ...menuDocs("frontend/interaction").map((doc) => ({
    id: `interaction:${doc.slug}`,
    group: "Interaction" as const,
    title: doc.meta.title ?? doc.slug,
    href: `/frontend/interaction/${doc.slug}`,
    description: doc.meta.summary ?? doc.meta.description ?? "",
    keywords: plainText(doc.source),
  })),
  page("Agents", "Agents", "/playbook/agents", "webapp@dev-goraebap 플러그인 설치와 범위"),
  page("용어집", "용어집", "/frontend/glossary", "문서에 쓰는 용어 모음"),
  ...Object.entries(GLOSSARY).map(([key, entry]) => ({
    id: `glossary:${key}`,
    group: "용어집" as const,
    title: entry.korean ? `${entry.korean} ${entry.term}` : entry.term,
    href: "/frontend/glossary",
    hash: key,
    description: stripGlossaryMarkup(entry.definition),
    keywords: `${entry.category} ${stripGlossaryMarkup(entry.definition)}`,
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
