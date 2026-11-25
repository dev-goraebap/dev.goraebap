import { Outlet, createFileRoute, useParams } from "@tanstack/react-router";
import { StackSwitcher, menuDocs, stacksOf, docHref, SKILL_SLUG } from "@/entities/content-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/frontend/engineering")({
  component: FrontendEngineeringLayout,
});

const MENU = "frontend/engineering";
const DOCS = menuDocs(MENU);
const STACKS = stacksOf(MENU);

function navFor(stack: string): DocsNavGroup[] {
  const groups: DocsNavGroup[] = [];
  for (const doc of DOCS) {
    const title = doc.isSkill ? undefined : doc.meta.group || undefined;
    let group = groups.at(-1);
    if (!group || group.title !== title || doc.isSkill) groups.push((group = { title, items: [] }));
    group.items.push({
      label: doc.meta.title ?? doc.slug,
      href: docHref(doc, stack),
      icon: doc.isSkill ? "details" : doc.meta.icon,
      badge: doc.isSkill ? "AI" : undefined,
    });
  }
  return groups;
}

function FrontendEngineeringLayout() {
  const params = useParams({ strict: false }) as { slug?: string; stack?: string };
  const stack = params.stack && STACKS.includes(params.stack) ? params.stack : STACKS[0];
  const slug = params.slug ?? SKILL_SLUG;
  return (
    <DocsShell
      label="Frontend Engineering 탐색"
      groups={navFor(stack)}
      header={
        <StackSwitcher
          space="frontend"
          stacks={STACKS}
          current={stack}
          hrefFor={(next) => `/${MENU}/${slug}/${next}`}
        />
      }
    >
      <Outlet />
    </DocsShell>
  );
}
