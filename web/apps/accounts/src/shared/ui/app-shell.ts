import { Component } from "@angular/core";

// 인셋 앱 셸(디자인 시스템 레이아웃 "워크스페이스 · 관리자"). 업무를 모르는 틀만 맡고,
// 메뉴·브랜드·바닥 내용은 쓰는 쪽이 칸에 넣는다.
// 데스크톱: 왼쪽 사이드바 + 둥근 본문 면. 휴대폰: 위 앱 바 + 본문 + 아래 탭 바.
@Component({
  selector: "gb-app-shell",
  template: `
    <aside class="hidden w-72 shrink-0 flex-col gap-6 px-4 py-5 lg:flex">
      <ng-content select="[shellBrand]" />
      <nav aria-label="주요 메뉴" class="flex flex-col gap-0.5">
        <ng-content select="[shellNav]" />
      </nav>
      <div class="min-h-0 flex-1"><ng-content select="[shellAside]" /></div>
      <ng-content select="[shellFooter]" />
    </aside>
    <div
      class="bg-background lg:border-border flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:my-2 lg:mr-2 lg:rounded-2xl lg:border lg:shadow-xs"
    >
      <header
        class="border-border flex h-15 shrink-0 items-center justify-between gap-3 border-b px-4 lg:hidden"
      >
        <ng-content select="[shellMobileBar]" />
      </header>
      <main id="main" class="min-h-0 flex-1 overflow-y-auto">
        <ng-content />
      </main>
      <nav aria-label="주요 메뉴" class="border-border flex h-14 shrink-0 border-t lg:hidden">
        <ng-content select="[shellBottomNav]" />
      </nav>
    </div>
  `,
  host: { class: "flex h-dvh flex-col bg-sidebar lg:flex-row" },
})
export class AppShell {}
