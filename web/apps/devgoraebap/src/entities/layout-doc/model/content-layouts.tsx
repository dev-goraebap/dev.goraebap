import {
  DetailActivityExample,
  DetailOutlineExample,
  DetailPropertiesPreview,
  FormActionsExample,
  FormPreview,
  FormSectionsExample,
  ListDetailHeadersExample,
  ListDetailPreview,
  ListDetailTabsExample,
  ListFiltersExample,
  ListPreview,
  ListViewsExample,
  SettingsPreview,
  SettingsRowsExample,
  TableFooterExample,
} from "../ui/ContentLayoutPreviews";
import { LayoutThumbnail } from "../ui/LayoutPreviews";
import type { LayoutDocSpec } from "./types";

const PAGE_HEADER = `<header class="flex h-13 shrink-0 items-center px-4"><!-- Page Header --></header>`;
const TOOLBAR = `<div class="flex h-11 shrink-0 items-center px-4"><!-- Toolbar --></div>`;

export const CONTENT_LAYOUT_DOCS: LayoutDocSpec[] = [
  {
    id: "list",
    name: "목록 · 표",
    level: "content",
    summary: "회원, 주문, 업무처럼 같은 종류의 항목을 찾고 비교하는 표 중심 배치",
    getCode: () => `<div class="flex h-full min-h-0 flex-col">
  ${PAGE_HEADER}
  ${TOOLBAR}
  <main class="min-h-0 flex-1 overflow-y-auto"><!-- List --></main>
</div>`,
    renderPreview: () => <ListPreview />,
    renderThumbnail: () => (
      <LayoutThumbnail>
        <ListPreview />
      </LayoutThumbnail>
    ),
    examples: [
      {
        id: "views",
        title: "보기 탭과 도구",
        description: "같은 목록을 전체, 내 업무, 완료처럼 자주 바꿔 보는 화면에 씁니다.",
        getCode: () => `<div class="flex h-full min-h-0 flex-col">
  ${PAGE_HEADER}
  <div class="flex h-11 shrink-0 items-center justify-between gap-2 px-4">
    <nav class="min-w-0 flex-1 overflow-x-auto"><!-- View Tabs --></nav>
    <div class="shrink-0"><!-- Tools --></div>
  </div>
  <main class="min-h-0 flex-1 overflow-y-auto"><!-- List --></main>
</div>`,
        renderPreview: () => <ListViewsExample />,
      },
      {
        id: "filters",
        title: "적용한 필터",
        description:
          "여러 조건을 함께 걸어 목록을 좁히고, 현재 적용된 조건을 확인해 해제할 수 있어야 할 때 씁니다.",
        getCode: () => `<div class="flex h-full min-h-0 flex-col">
  ${PAGE_HEADER}
  ${TOOLBAR}
  <div class="flex min-h-9 shrink-0 flex-wrap items-center gap-1 px-4"><!-- Applied Filters --></div>
  <main class="min-h-0 flex-1 overflow-y-auto"><!-- List --></main>
</div>`,
        renderPreview: () => <ListFiltersExample />,
      },
      {
        id: "table",
        title: "표와 끝 줄",
        description:
          "항목마다 여러 속성을 열 기준으로 비교하면서 전체 건수나 더 보기가 필요할 때 씁니다.",
        getCode: () => `<div class="flex h-full min-h-0 flex-col">
  ${PAGE_HEADER}
  ${TOOLBAR}
  <main class="min-h-0 flex-1 overflow-auto">
    <table class="w-full">
      <thead class="sticky top-0 h-11"><!-- Table Head --></thead>
      <tbody><!-- Rows --></tbody>
    </table>
    <div class="flex h-11 items-center px-4"><!-- List Footer --></div>
  </main>
</div>`,
        renderPreview: () => <TableFooterExample />,
      },
    ],
  },
  {
    id: "list-detail",
    name: "목록 · 상세",
    level: "content",
    summary: "메일함, 이슈, 고객 문의처럼 항목을 차례로 훑으며 내용을 바로 확인하는 분할 배치",
    getCode: () => `<div class="flex h-full min-h-0">
  <section class="w-full min-w-0 overflow-y-auto lg:w-80 lg:shrink-0 lg:border-r"><!-- List --></section>
  <main class="hidden min-w-0 flex-1 overflow-y-auto lg:block"><!-- Detail --></main>
</div>`,
    renderPreview: () => <ListDetailPreview />,
    renderThumbnail: () => (
      <LayoutThumbnail>
        <ListDetailPreview />
      </LayoutThumbnail>
    ),
    examples: [
      {
        id: "headers",
        title: "칸 헤더와 툴바",
        description:
          "목록을 검색이나 필터로 좁히면서 선택한 항목의 수정·삭제 같은 동작도 함께 실행할 때 씁니다.",
        getCode: () => `<div class="flex h-full min-h-0">
  <section class="flex w-full min-w-0 flex-col lg:w-80 lg:shrink-0 lg:border-r">
    <header class="h-13 shrink-0"><!-- List Header --></header>
    <div class="h-11 shrink-0"><!-- Toolbar --></div>
    <div class="min-h-0 flex-1 overflow-y-auto"><!-- List --></div>
  </section>
  <main class="hidden min-w-0 flex-1 flex-col lg:flex">
    <header class="h-13 shrink-0"><!-- Pane Header --></header>
    <div class="min-h-0 flex-1 overflow-y-auto"><!-- Detail --></div>
  </main>
</div>`,
        renderPreview: () => <ListDetailHeadersExample />,
      },
      {
        id: "tabs",
        title: "상세 안의 탭",
        description: "개요, 활동, 파일처럼 선택한 항목의 상세 정보가 여러 종류로 나뉠 때 씁니다.",
        getCode: () => `<div class="flex h-full min-h-0">
  <section class="flex w-full min-w-0 flex-col lg:w-80 lg:shrink-0 lg:border-r">
    <header class="h-13 shrink-0"><!-- List Header --></header>
    <div class="min-h-0 flex-1 overflow-y-auto"><!-- List --></div>
  </section>
  <main class="hidden min-w-0 flex-1 flex-col lg:flex">
    <header class="h-13 shrink-0"><!-- Pane Header --></header>
    <nav class="h-11 shrink-0"><!-- Tabs --></nav>
    <div class="min-h-0 flex-1 overflow-y-auto"><!-- Tab Panel --></div>
  </main>
</div>`,
        renderPreview: () => <ListDetailTabsExample />,
      },
    ],
  },
  {
    id: "detail-properties",
    name: "상세 · 속성",
    level: "content",
    summary: "이슈, 문서, 주문처럼 본문을 읽으며 상태·담당자·날짜 속성을 함께 확인하는 배치",
    getCode: () => `<div class="@container h-full overflow-y-auto">
  <div class="flex flex-col gap-4 p-4 @min-[60rem]:flex-row @min-[60rem]:justify-center">
    <aside class="order-1 shrink-0 @min-[60rem]:order-2 @min-[60rem]:w-64"><!-- Properties --></aside>
    <article class="order-2 min-w-0 flex-1 @min-[60rem]:order-1 @min-[60rem]:max-w-[45rem]"><!-- Reading Column --></article>
  </div>
</div>`,
    renderPreview: () => <DetailPropertiesPreview />,
    renderThumbnail: () => (
      <LayoutThumbnail>
        <DetailPropertiesPreview />
      </LayoutThumbnail>
    ),
    examples: [
      {
        id: "activity",
        title: "제목, 본문, 활동",
        description: "댓글이나 변경 기록을 본문과 이어서 함께 읽어야 하는 상세 화면에 씁니다.",
        getCode: () => `<div class="@container h-full overflow-y-auto">
  <div class="flex flex-col gap-4 p-4 @min-[60rem]:flex-row @min-[60rem]:justify-center">
    <aside class="order-1 shrink-0 @min-[60rem]:order-2 @min-[60rem]:w-64"><!-- Properties --></aside>
    <article class="order-2 min-w-0 flex-1 space-y-4 @min-[60rem]:order-1 @min-[60rem]:max-w-[45rem]">
      <h1><!-- Title --></h1>
      <div><!-- Body --></div>
      <section><!-- Activity --></section>
    </article>
  </div>
</div>`,
        renderPreview: () => <DetailActivityExample />,
      },
      {
        id: "outline",
        title: "목차와 정보",
        description:
          "제목이 많은 긴 문서에서 원하는 위치로 바로 이동하고 작성자나 수정일을 확인할 때 씁니다.",
        getCode: () => `<div class="@container h-full overflow-y-auto">
  <div class="flex flex-col gap-4 p-4 @min-[60rem]:flex-row @min-[60rem]:justify-center">
    <aside class="order-1 shrink-0 space-y-4 @min-[60rem]:order-2 @min-[60rem]:w-64">
      <nav class="hidden @min-[60rem]:block"><!-- Outline --></nav>
      <section><!-- Properties --></section>
      <section class="hidden @min-[60rem]:block"><!-- Info --></section>
    </aside>
    <article class="order-2 min-w-0 flex-1 @min-[60rem]:order-1 @min-[60rem]:max-w-[45rem]"><!-- Reading Column --></article>
  </div>
</div>`,
        renderPreview: () => <DetailOutlineExample />,
      },
    ],
  },
  {
    id: "settings",
    name: "설정",
    level: "content",
    summary: "계정이나 워크스페이스의 값과 정책을 항목별로 확인하고 바꾸는 설정 배치",
    getCode: () => `<main class="h-full overflow-y-auto px-4 py-10">
  <div class="mx-auto w-full max-w-[45rem] space-y-8">
    <h1><!-- Title --></h1>
    <section><!-- Section --></section>
    <section><!-- Section --></section>
  </div>
</main>`,
    renderPreview: () => <SettingsPreview />,
    renderThumbnail: () => (
      <LayoutThumbnail>
        <SettingsPreview />
      </LayoutThumbnail>
    ),
    examples: [
      {
        id: "rows",
        title: "구역과 항목",
        description: "서로 관련된 설정을 묶어 각 항목을 하나씩 확인하고 바꿀 때 씁니다.",
        getCode: () => `<section class="mx-auto w-full max-w-[45rem] space-y-2">
  <h2><!-- Section Name --></h2>
  <div class="divide-y rounded-xl border">
    <div class="flex items-center justify-between gap-4 p-4">
      <span class="min-w-0"><!-- Name --></span>
      <div class="w-28 shrink-0 sm:w-56"><!-- Value --></div>
    </div>
  </div>
</section>`,
        renderPreview: () => <SettingsRowsExample />,
      },
    ],
  },
  {
    id: "form",
    name: "입력 폼",
    level: "content",
    summary: "생성, 수정, 신청처럼 사용자가 여러 항목을 채워 제출하는 입력 폼 배치",
    getCode: () => `<main class="h-full overflow-y-auto px-4 py-10">
  <form class="mx-auto w-full max-w-[45rem] space-y-6">
    <h1><!-- Title --></h1>
    <div><!-- Form --></div>
    <div class="flex justify-end gap-2"><!-- Actions --></div>
  </form>
</main>`,
    renderPreview: () => <FormPreview />,
    renderThumbnail: () => (
      <LayoutThumbnail>
        <FormPreview />
      </LayoutThumbnail>
    ),
    examples: [
      {
        id: "sections",
        title: "섹션과 입력 칸",
        description: "입력 항목이 많을 때 관련 필드를 섹션으로 묶어 순서대로 채우게 할 때 씁니다.",
        getCode: () => `<form class="mx-auto w-full max-w-[45rem] space-y-8">
  <section class="space-y-4">
    <h2><!-- Section 1 --></h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <!-- Field --><!-- Field -->
    </div>
  </section>
  <section class="space-y-4">
    <h2><!-- Section 2 --></h2>
    <!-- Field -->
  </section>
</form>`,
        renderPreview: () => <FormSectionsExample />,
      },
      {
        id: "actions",
        title: "바닥 고정 저장 줄",
        description: "입력이 길어져도 저장과 취소 동작이 항상 보이게 유지할 때 씁니다.",
        getCode: () => `<div class="flex h-full min-h-0 flex-col">
  <main class="min-h-0 flex-1 overflow-y-auto px-4 py-10">
    <form class="mx-auto w-full max-w-[45rem]"><!-- Form --></form>
  </main>
  <div class="flex h-14 shrink-0 items-center justify-end border-t px-4"><!-- Action Bar --></div>
</div>`,
        renderPreview: () => <FormActionsExample />,
      },
    ],
  },
];
