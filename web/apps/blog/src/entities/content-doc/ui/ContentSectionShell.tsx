import { Outlet, useLocation } from "@tanstack/react-router";
import { DocsShell } from "@/shared/ui";
import { docHref, stackSpace, stacksOf } from "../model/content";
import { sectionNavGroups } from "../model/nav";
import { StackSwitcher } from "./StackSwitcher";

// 섹션(하위 폴더를 묶음으로 쓰는 메뉴)의 틀: 묶음별 사이드바와 맨 위 스택 선택기. 주소의 마지막 마디가 스택이다.
export function ContentSectionShell({ root, label }: { root: string; label: string }) {
  const { pathname } = useLocation();
  const stacks = stacksOf(root);
  const last = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const stack = stacks.includes(last) ? last : stacks[0];
  const base = stacks.includes(last) ? pathname.replace(/\/[^/]+\/?$/, "") : undefined;
  return (
    <DocsShell
      label={label}
      groups={sectionNavGroups(root, (doc) => docHref(doc, stack))}
      header={
        base ? (
          <StackSwitcher
            space={stackSpace(root)}
            stacks={stacks}
            current={stack}
            hrefFor={(next) => `${base}/${next}`}
          />
        ) : undefined
      }
    >
      <Outlet />
    </DocsShell>
  );
}
