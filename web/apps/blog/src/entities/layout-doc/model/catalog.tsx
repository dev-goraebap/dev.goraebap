import {
  AppShellCollapsedSidebarExample,
  AppShellPreview,
  AppShellSidebarExample,
  LandingPreview,
  LayoutThumbnail,
  SidebarContentPreview,
  SingleColumnPreview,
  type AppShellVariant,
} from "../ui/LayoutPreviews";
import { CONTENT_LAYOUT_DOCS } from "./content-layouts";
import type { LayoutDocSpec, LayoutExample, LayoutLevel } from "./types";

export const LAYOUT_LEVELS: { id: LayoutLevel; title: string }[] = [
  { id: "shell", title: "앱 외곽" },
  { id: "content", title: "메인 영역" },
];

function indent(text: string, spaces: number) {
  const padding = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${padding}${line}`))
    .join("\n");
}

const SHELL_MAIN_CLASS: Record<AppShellVariant, string> = {
  inset:
    "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background lg:my-2 lg:mr-2 lg:rounded-2xl lg:border lg:shadow-xs",
  split: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background lg:border-l",
};

function appShellCode(
  variant: AppShellVariant,
  content: string,
  sidebar = "<!-- Sidebar -->",
  sidebarWidthClass = "w-72",
) {
  return `<div class="flex h-dvh flex-col bg-sidebar lg:flex-row">
  <aside class="hidden ${sidebarWidthClass} shrink-0 flex-col lg:flex">
    ${indent(sidebar, 4)}
  </aside>
  <div class="${SHELL_MAIN_CLASS[variant]}">
    <header class="h-15 shrink-0 lg:hidden"><!-- App Bar --></header>
    ${indent(content, 4)}
    <nav class="h-14 shrink-0 lg:hidden"><!-- Bottom Bar --></nav>
  </div>
</div>`;
}

const CONTENT_MAIN = `<main class="min-h-0 flex-1 overflow-y-auto p-4"><!-- Main --></main>`;

const APP_SHELL_EXAMPLES: LayoutExample[] = [
  {
    id: "sidebar",
    title: "사이드바 구성",
    defaultWidth: 1280,
    description:
      "작업 공간 전환과 자주 여는 전역 탐색을 앞쪽에 두고, 항목 수가 늘어나는 주 메뉴는 가운데에 채웁니다. 사용 빈도가 낮은 내 프로필은 하단 영역으로 분리해 주 메뉴가 길어져도 가리지 않게 합니다.",
    getCode: (variant) =>
      appShellCode(
        variant,
        CONTENT_MAIN,
        `<div class="flex h-13 shrink-0 items-center gap-2 px-2">
  <!-- Logo --><!-- Space -->
</div>
<nav class="shrink-0 p-2"><!-- Global --></nav>
<nav class="min-h-0 flex-1 overflow-y-auto p-2"><!-- Menu --></nav>
<div class="shrink-0 p-2"><!-- Profile --></div>`,
      ),
    renderPreview: (variant) => <AppShellSidebarExample variant={variant} />,
  },
  {
    id: "collapsed",
    title: "접힌 사이드바",
    defaultWidth: 1280,
    description:
      "표나 캔버스처럼 작업 면을 넓게 써야 할 때 사이드바를 아이콘 폭으로 접어 둡니다. 같은 순서를 유지한 채 아이콘만 남겨 현재 위치를 잃지 않게 합니다.",
    getCode: (variant) =>
      appShellCode(
        variant,
        CONTENT_MAIN,
        `<div class="flex h-13 shrink-0 items-center justify-center"><!-- Logo --></div>
<nav class="shrink-0 p-2"><!-- Global Icons --></nav>
<nav class="min-h-0 flex-1 overflow-y-auto p-2"><!-- Menu Icons --></nav>
<div class="shrink-0 p-2"><!-- Profile Avatar --></div>`,
        "w-16",
      ),
    renderPreview: (variant) => <AppShellCollapsedSidebarExample variant={variant} />,
  },
];

const SIDEBAR_CONTENT_CODE = `<div class="min-h-dvh">
  <header class="sticky top-0 z-30 h-14 border-b"><!-- Header --></header>
  <div class="mx-auto flex max-w-7xl gap-10 px-6">
    <aside class="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 lg:block">
      <!-- Sidebar -->
    </aside>
    <div class="flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-1 flex-col">
      <main class="flex-1 py-10"><!-- Main --></main>
      <footer class="border-t py-8"><!-- Footer --></footer>
    </div>
  </div>
</div>`;

const SINGLE_COLUMN_CODE = `<div class="flex min-h-dvh flex-col">
  <header class="h-14 shrink-0 border-b"><!-- Header --></header>
  <main class="mx-auto w-full max-w-2xl flex-1 px-6 py-10"><!-- Main --></main>
  <footer class="shrink-0 border-t py-8"><!-- Footer --></footer>
</div>`;

const LANDING_CODE = `<div class="flex min-h-dvh flex-col">
  <header class="sticky top-0 z-30 h-14 border-b"><!-- Header --></header>
  <main class="mx-auto w-full max-w-7xl flex-1 space-y-24 px-6 py-16">
    <section><!-- Hero Section --></section>
    <section><!-- Stats Bar --></section>
    <section><!-- Bento Grid --></section>
    <section><!-- Feature Split --></section>
    <section><!-- Closing CTA --></section>
  </main>
  <footer class="border-t py-8"><!-- Footer --></footer>
</div>`;

export const LAYOUT_DOCS: LayoutDocSpec[] = [
  {
    id: "app-shell",
    name: "워크스페이스 · 관리자",
    level: "shell",
    summary:
      "로그인 후 여러 메뉴를 오가는 업무 도구용 골격, 차분한 구분은 Inset·넓은 작업 면은 Split",
    variants: [
      { id: "inset", label: "Inset" },
      { id: "split", label: "Split" },
    ],
    getCode: (variant) => appShellCode(variant, CONTENT_MAIN),
    renderPreview: (variant) => <AppShellPreview variant={variant} />,
    renderThumbnail: () => (
      <LayoutThumbnail>
        <AppShellPreview variant="inset" />
      </LayoutThumbnail>
    ),
    examples: APP_SHELL_EXAMPLES,
  },
  {
    id: "sidebar-content",
    name: "문서 · 블로그",
    level: "shell",
    summary: "개발 문서, 가이드, 카테고리 블로그처럼 목록에서 다음 글을 찾아 읽는 사이트용 골격",
    getCode: () => SIDEBAR_CONTENT_CODE,
    renderPreview: () => <SidebarContentPreview />,
    renderThumbnail: () => (
      <LayoutThumbnail>
        <SidebarContentPreview />
      </LayoutThumbnail>
    ),
  },
  {
    id: "single-column",
    name: "단일 페이지",
    level: "shell",
    summary: "글 한 편, 약관, 공지, 짧은 안내처럼 한 가지 내용에 집중해 읽는 화면용 골격",
    getCode: () => SINGLE_COLUMN_CODE,
    renderPreview: () => <SingleColumnPreview />,
    renderThumbnail: () => (
      <LayoutThumbnail>
        <SingleColumnPreview />
      </LayoutThumbnail>
    ),
  },
  {
    id: "landing",
    name: "랜딩 페이지",
    level: "shell",
    summary:
      "제품 소개나 첫 화면처럼 핵심 가치와 기능을 섹션별로 풀어내며 다음 행동으로 이끄는 골격",
    getCode: () => LANDING_CODE,
    renderPreview: () => <LandingPreview />,
    renderThumbnail: () => (
      <LayoutThumbnail>
        <LandingPreview />
      </LayoutThumbnail>
    ),
  },
  ...CONTENT_LAYOUT_DOCS,
];

export function getLayoutDoc(id: string) {
  return LAYOUT_DOCS.find((item) => item.id === id);
}
