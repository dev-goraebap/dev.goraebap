import { COMPONENT_DOCS } from "@/entities/component-doc";
import { DETAIL_DOCS } from "@/entities/detail-doc";
import { LAYOUT_DOCS } from "@/entities/layout-doc";
import { PLAYBOOK_DOCS } from "@/entities/playbook-doc";
import { GLOSSARY, stripGlossaryMarkup } from "@/shared/lib/glossary";

export const DOC_GROUPS = [
  "Playbook",
  "디자인 시스템",
  "파운데이션",
  "컴포넌트",
  "레이아웃",
  "Details",
  "Agent",
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
const SUGGESTED_GROUPS: DocEntry["group"][] = ["디자인 시스템", "파운데이션", "Details", "Agent"];

const page = (
  group: DocEntry["group"],
  title: string,
  href: string,
  description: string,
): DocEntry => ({ id: href, group, title, href, description, keywords: description });

const DOC_ENTRIES: DocEntry[] = [
  ...PLAYBOOK_DOCS.map((doc) => ({
    id: `playbook:${doc.slug}`,
    group: "Playbook" as const,
    title: doc.title,
    href: `/playbook/${doc.slug}`,
    description: doc.summary,
    keywords: `${doc.slug} ${doc.group} ${doc.summary} ${doc.sections.map((section) => `${section.title ?? ""} ${section.paragraphs.join(" ")}`).join(" ")}`,
  })),
  page("디자인 시스템", "개요", "/frontend/overview", "디자인 시스템의 구조와 쓰임"),
  page(
    "파운데이션",
    "디자인 토큰",
    "/frontend/foundations/tokens",
    "색상 테마, 라이트와 다크, 반경, 타이포그래피",
  ),
  page("파운데이션", "스타일 레시피", "/frontend/foundations/recipes", "Style Recipe와 변형"),
  page("컴포넌트", "컴포넌트 개요", "/frontend/components", "전체 컴포넌트 목록"),
  ...COMPONENT_DOCS.map((doc) => ({
    id: `component:${doc.slug}`,
    group: "컴포넌트" as const,
    title: doc.name,
    href: `/frontend/components/${doc.slug}`,
    description: stripGlossaryMarkup(doc.summary),
    keywords: `${doc.slug} ${doc.category} ${stripGlossaryMarkup(doc.summary)}`,
  })),
  page("레이아웃", "레이아웃 개요", "/frontend/layouts", "앱 외곽과 메인 영역 레이아웃"),
  ...LAYOUT_DOCS.map((doc) => ({
    id: `layout:${doc.id}`,
    group: "레이아웃" as const,
    title: doc.name,
    href: `/frontend/layouts/${doc.id}`,
    description: doc.summary,
    keywords: `${doc.id} ${doc.summary}`,
  })),
  page("Details", "Details 개요", "/frontend/details", "화면 완성도를 높이는 기준"),
  ...DETAIL_DOCS.flatMap((doc) => [
    {
      id: `detail:${doc.slug}`,
      group: "Details" as const,
      title: doc.title,
      href: `/frontend/details/${doc.slug}`,
      description: doc.summary,
      keywords: `${doc.slug} ${doc.summary} ${doc.problem ?? ""} ${doc.guidance ?? ""}`,
    },
    ...(doc.sections ?? []).map((section) => ({
      id: `detail:${doc.slug}:${section.id}`,
      group: "Details" as const,
      title: section.title,
      href: `/frontend/details/${doc.slug}`,
      hash: section.id,
      description: doc.title,
      keywords: `${doc.title} ${section.problem} ${section.guidance}`,
    })),
  ]),
  page("Agent", "Agent", "/frontend/agent", "frontend@dev-goraebap 플러그인과 패키지 연결"),
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
