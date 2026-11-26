import { Outlet, createFileRoute, useLocation, useParams } from "@tanstack/react-router";
import type { SystemIconName } from "@goraebap/ui-react/icons";
import {
  StackSwitcher,
  contentNavGroups,
  docHref,
  menuDocs,
  stacksOf,
  type ContentDoc,
} from "@/entities/content-doc";
import { LAYOUT_DOCS, layoutPage } from "@/entities/layout-doc";
import { DocsShell, type DocsNavGroup } from "@/shared/ui";

export const Route = createFileRoute("/design-system")({
  component: LibraryLayout,
});

const GUIDE_GROUPS: DocsNavGroup[] = [
  {
    items: [{ label: "개요", href: "/design-system/overview", icon: "book" }],
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
    { label: "모든 레이아웃", href: "/design-system/layouts", icon: "overview" },
    ...LAYOUT_DOCS.filter((item) => item.level === "shell").map((item) => ({
      label: item.name,
      href: layoutPage(item.id),
      icon: SHELL_ICONS[item.id],
      ...(item.id === "app-shell"
        ? {
            children: LAYOUT_DOCS.filter((sub) => sub.level === "content").map((sub) => ({
              label: sub.name,
              href: layoutPage(sub.id),
            })),
          }
        : {}),
    })),
  ],
};

// 컴포넌트 문서는 content의 하위 메뉴(components)이고, 머리말의 묶음(쓰임별 분류)으로 나눈다.
const COMPONENT_MENU = "design-system/components";
const COMPONENT_DOCS = menuDocs(COMPONENT_MENU).filter((doc) => !doc.isSkill);

function componentGroup(stack?: string): DocsNavGroup {
  const categories = [...new Set(COMPONENT_DOCS.map((doc) => doc.meta.group ?? ""))];
  return {
    title: "컴포넌트",
    items: [
      { label: "모든 컴포넌트", href: "/design-system/components", icon: "overview" },
      ...categories.map((category) => ({
        label: category,
        children: COMPONENT_DOCS.filter((doc) => (doc.meta.group ?? "") === category).map(
          (doc) => ({ label: doc.meta.title ?? doc.slug, href: contentHref(doc, stack) }),
        ),
      })),
    ],
  };
}

// content가 원본인 문서(파운데이션·패턴 등)와 AI 지침. 스택을 고른 문서 화면에서는 그 스택 주소로, 다른 화면에서는 고른 적 있는 스택으로 보내는 주소로 잇는다.
const MENU = "design-system";
const DOCS = menuDocs(MENU);
const STACKS = stacksOf(MENU);
const contentHref = (doc: ContentDoc, stack?: string) =>
  stack ? docHref(doc, stack) : `/${doc.menu}/${doc.slug}`;

function contentGroups(stack?: string): DocsNavGroup[] {
  // 레이아웃 문서는 위의 레이아웃 묶음이 견본 이름으로 잇는다.
  return contentNavGroups(
    DOCS.filter((each) => each.meta.group !== "레이아웃"),
    (doc) => contentHref(doc, stack),
  );
}

// 파운데이션은 개요 바로 아래에, 나머지 content 묶음(패턴·AI 지침)은 컴포넌트·레이아웃 뒤에 둔다.
function sidebarGroups(stack?: string): DocsNavGroup[] {
  const content = contentGroups(stack);
  const foundations = content.filter((group) => group.title === "파운데이션");
  const rest = content.filter((group) => group.title !== "파운데이션");
  return [...GUIDE_GROUPS, ...foundations, componentGroup(stack), LAYOUT_GROUP, ...rest];
}

function LibraryLayout() {
  const params = useParams({ strict: false }) as { slug?: string; stack?: string };
  const location = useLocation();
  const stack = params.stack && STACKS.includes(params.stack) ? params.stack : undefined;
  return (
    <DocsShell
      label="문서 탐색"
      groups={sidebarGroups(stack)}
      header={
        stack && params.slug ? (
          <StackSwitcher
            space="frontend"
            stacks={STACKS}
            current={stack}
            hrefFor={(next) => `${location.pathname.split("/").slice(0, -1).join("/")}/${next}`}
          />
        ) : undefined
      }
    >
      <Outlet />
    </DocsShell>
  );
}
