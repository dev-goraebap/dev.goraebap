import { useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import {
  ContentArticle,
  docHref,
  menuDocs,
  rememberStack,
  stacksOf,
  type ContentDoc,
} from "@/entities/content-doc";
import { PAGE_SKILLS } from "@/entities/code-example";
import { BACKEND_ENGINEERING_DOCS } from "@/entities/webapp-doc";
import { DocPager, PageState } from "@/shared/ui";

export const Route = createFileRoute("/frontend/design-system/$slug/$stack/")({
  component: FrontendDesignSystemPage,
});

const MENU = "frontend/design-system";
const DOCS = menuDocs(MENU);
const STACKS = stacksOf(MENU);

// 아직 content로 옮기지 않은 스킬 파일을 그 지침을 옮긴 사이트 페이지로 잇는다.
const SKILL_PAGES = new Map<string, string>([
  ...Object.entries(PAGE_SKILLS).flatMap(([href, { skills }]) =>
    skills.map((skill) => [skill, href] as const),
  ),
  ...BACKEND_ENGINEERING_DOCS.flatMap((doc) =>
    (doc.skills ?? []).map((skill) => [skill, `/backend/engineering/${doc.slug}`] as const),
  ),
]);
const skillPageHref = (skill: string) => SKILL_PAGES.get(skill);

const toLink = (stack: string, doc?: ContentDoc) =>
  doc ? { title: doc.meta.title ?? doc.slug, href: docHref(doc, stack) } : undefined;

function FrontendDesignSystemPage() {
  const { slug, stack } = Route.useParams();
  const index = DOCS.findIndex((doc) => doc.slug === slug);
  const doc = DOCS[index];
  const known = STACKS.includes(stack);

  useEffect(() => {
    if (known) rememberStack("frontend", stack);
  }, [known, stack]);

  if (!doc || !known) {
    return (
      <PageState
        kind="not-found"
        title="문서를 찾을 수 없습니다"
        action={
          <Link
            to="/frontend/design-system/overview"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            디자인 시스템 처음으로 돌아가기
          </Link>
        }
      />
    );
  }

  return (
    <ContentArticle
      doc={doc}
      stack={stack}
      skillHref={skillPageHref}
      trailing={
        <DocPager
          prevDoc={toLink(stack, DOCS[index - 1])}
          nextDoc={toLink(stack, DOCS[index + 1])}
        />
      }
    />
  );
}
