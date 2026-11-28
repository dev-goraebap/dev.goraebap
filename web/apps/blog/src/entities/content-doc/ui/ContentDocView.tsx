import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import {
  DocPager,
  MobileToc,
  PageState,
  TableOfContents,
  extractHeadingsFromMarkdown,
} from "@/shared/ui";
import {
  STACK_LABELS,
  docHref,
  menuDocs,
  sectionDocs,
  stackSpace,
  stacksOf,
  type ContentDoc,
} from "../model/content";
import type { SkillHref } from "../model/link";
import { rememberStack } from "../model/stack-choice";
import { ContentArticle } from "./ContentArticle";

interface Props {
  // content 기준 메뉴 경로(문서가 든 폴더). 예: design-system
  menu: string;
  // 앞뒤 문서를 이 섹션 전체 순서로 고른다. 없으면 메뉴 안에서 고른다.
  section?: string;
  slug: string;
  stack: string;
  skillHref: SkillHref;
  // 문서나 스택이 없을 때 돌아갈 곳
  back: { href: string; label: string };
  // AI 지침(SKILL.md)을 이 메뉴의 문서에서 뺀다.
  withoutSkill?: boolean;
}

const toLink = (stack: string, doc?: ContentDoc) =>
  doc ? { title: doc.meta.title ?? doc.slug, href: docHref(doc, stack) } : undefined;

// content 메뉴의 문서 한 장: 우측 고정 레일(기준 스택 전환 + 목차)과 앞뒤 문서 이동. 고른 스택을 기억한다.
export function ContentDocView({
  menu,
  section,
  slug,
  stack,
  skillHref,
  back,
  withoutSkill,
}: Props) {
  const docs = (section ? sectionDocs(section) : menuDocs(menu)).filter(
    (doc) => !withoutSkill || !doc.isSkill,
  );
  const index = docs.findIndex((doc) => doc.menu === menu && doc.slug === slug);
  const doc = docs[index];
  const stacks = stacksOf(menu);
  const known = stacks.includes(stack);
  const space = stackSpace(menu);

  useEffect(() => {
    if (known) rememberStack(space, stack);
  }, [known, space, stack]);

  if (!doc || !known) {
    return (
      <PageState
        kind="not-found"
        title="문서를 찾을 수 없습니다"
        action={
          <Link to={back.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {back.label}
          </Link>
        }
      />
    );
  }

  const headings = extractHeadingsFromMarkdown(doc.source);
  const hasStacks = stacks.length >= 2;
  const showAside = hasStacks || headings.length > 0;

  return (
    <div className="flex items-start gap-10">
      <ContentArticle
        doc={doc}
        stack={stack}
        skillHref={skillHref}
        headerExtra={
          hasStacks ? (
            <nav
              aria-label="문서 기준 선택"
              className="bg-muted/60 inline-flex flex-wrap gap-1 rounded-full p-1 xl:hidden"
            >
              {stacks.map((item) => {
                const selected = item === stack;
                return (
                  <Link
                    key={item}
                    to={docHref(doc, item)}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => rememberStack(space, item)}
                    className={
                      selected
                        ? "bg-background text-foreground rounded-full px-3.5 py-1 text-sm font-medium shadow-sm transition-colors"
                        : "text-muted-foreground hover:text-foreground rounded-full px-3.5 py-1 text-sm transition-colors"
                    }
                  >
                    {STACK_LABELS[item] ?? item}
                  </Link>
                );
              })}
            </nav>
          ) : undefined
        }
        beforeBody={<MobileToc items={headings} />}
        trailing={
          <DocPager
            prevDoc={toLink(stack, docs[index - 1])}
            nextDoc={toLink(stack, docs[index + 1])}
          />
        }
      />

      {showAside && (
        <aside
          aria-label="문서 탐색"
          className="hidden w-52 shrink-0 xl:sticky xl:top-[calc(3.5rem+2.5rem)] xl:block"
        >
          <div className="max-h-[calc(100dvh-7rem)] space-y-7 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {hasStacks && (
              <section aria-label="문서 기준 선택" className="space-y-2.5">
                <p className="text-muted-foreground text-xs font-semibold">기준</p>
                <nav
                  aria-label="스택"
                  className="border-border flex flex-col border-l text-[0.8125rem] leading-snug"
                >
                  {stacks.map((item) => {
                    const selected = item === stack;
                    return (
                      <Link
                        key={item}
                        to={docHref(doc, item)}
                        aria-current={selected ? "page" : undefined}
                        onClick={() => rememberStack(space, item)}
                        className={`py-1.5 pl-3 text-left transition-colors ${
                          selected
                            ? "border-foreground text-foreground -ml-px border-l-2 font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {STACK_LABELS[item] ?? item}
                      </Link>
                    );
                  })}
                </nav>
              </section>
            )}
            <TableOfContents items={headings} />
          </div>
        </aside>
      )}
    </div>
  );
}
