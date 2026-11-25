import { Outlet, createFileRoute, useParams } from "@tanstack/react-router";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import { COMPONENT_CATEGORIES, COMPONENT_DOCS } from "@/entities/component-doc";
import { StackSwitcher, menuDocs, stacksOf, docHref, type ContentDoc } from "@/entities/content-doc";
import { LAYOUT_DOCS } from "@/entities/layout-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/frontend/design-system")({
  component: LibraryLayout,
});

const GUIDE_GROUPS: DocsNavGroup[] = [
  {
    items: [
      { label: "개요", href: "/frontend/design-system/overview", icon: "book" },
    ],
  },
  {
    title: "파운데이션",
    items: [
      { label: "디자인 토큰", href: "/frontend/design-system/foundations/tokens", icon: "swatch" },
      { label: "스타일 레시피", href: "/frontend/design-system/foundations/recipes", icon: "code" },
    ],
  },
];

const SHELL_ICONS: Record<string, SystemIconName> = {
  "app-shell": "workspace",
  "sidebar-content": "book",
  "single-column": "file",
  landing: "details",
};

const LAYOUT_GROUP: DocsNavGroup = {
  title: "레이아웃",
  items: [
    { label: "모든 레이아웃", href: "/frontend/design-system/layouts", icon: "overview" },
    ...LAYOUT_DOCS.filter((item) => item.level === "shell").map((item) => ({
      label: item.name,
      href: `/frontend/design-system/layouts/${item.id}`,
      icon: SHELL_ICONS[item.id],
      ...(item.id === "app-shell"
        ? {
            children: LAYOUT_DOCS.filter((sub) => sub.level === "content").map((sub) => ({
              label: sub.name,
              href: `/frontend/design-system/layouts/${sub.id}`,
            })),
          }
        : {}),
    })),
  ],
};

const COMPONENT_GROUP: DocsNavGroup = {
  title: "컴포넌트",
  items: [
    { label: "모든 컴포넌트", href: "/frontend/design-system/components", icon: "overview" },
    ...COMPONENT_CATEGORIES.map((category) => ({
      label: category,
      children: COMPONENT_DOCS.filter((item) => item.category === category).map((item) => ({
        label: item.name,
        href: `/frontend/design-system/components/${item.slug}`,
      })),
    })),
  ],
};

// content가 원본인 문서(패턴 등)와 AI 지침. 스택을 고른 문서 화면에서는 그 스택 주소로, 다른 화면에서는 고른 적 있는 스택으로 보내는 주소로 잇는다.
const MENU = "frontend/design-system";
const DOCS = menuDocs(MENU);
const STACKS = stacksOf(MENU);
const contentHref = (doc: ContentDoc, stack?: string) =>
  stack ? docHref(doc, stack) : `/${doc.menu}/${doc.slug}`;

function contentGroups(stack?: string): DocsNavGroup[] {
  const groups: DocsNavGroup[] = [];
  for (const doc of DOCS) {
    const title = doc.isSkill ? undefined : doc.meta.group || undefined;
    let group = groups.at(-1);
    if (!group || group.title !== title || doc.isSkill) groups.push((group = { title, items: [] }));
    group.items.push({
      label: doc.meta.title ?? doc.slug,
      href: contentHref(doc, stack),
      icon: doc.isSkill ? "details" : doc.meta.icon,
      badge: doc.isSkill ? "AI" : undefined,
    });
  }
  return groups;
}

function LibraryLayout() {
  const params = useParams({ strict: false }) as { slug?: string; stack?: string };
  const stack = params.stack && STACKS.includes(params.stack) ? params.stack : undefined;
  return (
    <DocsShell
      label="문서 탐색"
      groups={[...GUIDE_GROUPS, COMPONENT_GROUP, LAYOUT_GROUP, ...contentGroups(stack)]}
      header={
        stack && params.slug ? (
          <StackSwitcher
            space="frontend"
            stacks={STACKS}
            current={stack}
            hrefFor={(next) => `/${MENU}/${params.slug}/${next}`}
          />
        ) : undefined
      }
    >
      <Outlet />
    </DocsShell>
  );
}
