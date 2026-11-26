import { Outlet, useParams } from "@tanstack/react-router";
import { DocsShell } from "@/shared/ui";
import { SKILL_SLUG, docHref, menuDocs, stackSpace, stacksOf } from "../model/content";
import { contentNavGroups } from "../model/nav";
import { StackSwitcher } from "./StackSwitcher";

// content 문서만으로 이뤄진 메뉴의 틀: 문서 묶음 사이드바와 맨 위 스택 선택기.
export function ContentMenuShell({ menu, label }: { menu: string; label: string }) {
  const params = useParams({ strict: false }) as { slug?: string; stack?: string };
  const stacks = stacksOf(menu);
  const stack = params.stack && stacks.includes(params.stack) ? params.stack : stacks[0];
  const slug = params.slug ?? SKILL_SLUG;
  return (
    <DocsShell
      label={label}
      groups={contentNavGroups(menuDocs(menu), (doc) => docHref(doc, stack))}
      header={
        <StackSwitcher
          space={stackSpace(menu)}
          stacks={stacks}
          current={stack}
          hrefFor={(next) => `/${menu}/${slug}/${next}`}
        />
      }
    >
      <Outlet />
    </DocsShell>
  );
}
