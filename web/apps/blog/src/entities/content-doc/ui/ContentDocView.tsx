import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import { DocPager, PageState } from "@/shared/ui";
import {
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
  // content 기준 메뉴 경로(문서가 든 폴더). 예: reference/frontend/routing
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

// content 메뉴의 문서 한 장: 고른 스택의 글과 앞뒤 문서 이동. 고른 스택을 기억한다.
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
  const known = stacksOf(menu).includes(stack);
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

  return (
    <ContentArticle
      doc={doc}
      stack={stack}
      skillHref={skillHref}
      trailing={
        <DocPager
          prevDoc={toLink(stack, docs[index - 1])}
          nextDoc={toLink(stack, docs[index + 1])}
        />
      }
    />
  );
}
