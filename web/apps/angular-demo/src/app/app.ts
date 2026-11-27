import { NgComponentOutlet } from "@angular/common";
import { Component, ElementRef, afterNextRender, viewChild } from "@angular/core";
import {
  applyDesignPayload,
  notifyReady,
  observeDemoHeight,
  type DemoDesignPayload,
} from "../bridge";
import { ANGULAR_DEMOS } from "./demos";

@Component({
  selector: "gb-demo-root",
  imports: [NgComponentOutlet],
  template: `
    <div
      #stage
      [class]="
        isEmbedded
          ? 'bg-dots bg-background/70 text-foreground flex min-h-56 w-full items-center justify-center p-6 transition-colors sm:p-8'
          : 'bg-background text-foreground min-h-screen px-6 py-10'
      "
    >
      @if (demoSlug) {
        @if (activeDemo) {
          <ng-container *ngComponentOutlet="activeDemo.component" />
        } @else {
          <p class="text-muted-foreground text-sm">
            &ldquo;{{ demoSlug }}&rdquo; Angular 데모가 아직 준비되지 않았습니다.
          </p>
        }
      } @else {
        <main class="mx-auto max-w-4xl space-y-8">
          <header class="border-border space-y-2 border-b pb-5">
            <p class="text-muted-foreground font-mono text-xs uppercase">@goraebap/angular-demo</p>
            <h1 class="text-2xl font-bold tracking-tight">Angular 라이브 데모</h1>
            <p class="text-muted-foreground text-sm">
              &#64;goraebap/ui-angular 어댑터 컴포넌트를 독립 런타임에서 확인합니다.
            </p>
          </header>
          <div class="grid gap-6">
            @for (item of demos; track item.slug) {
              <section class="border-border bg-card overflow-hidden rounded-2xl border">
                <div class="border-border flex items-center justify-between border-b px-4 py-2.5">
                  <h2 class="text-sm font-semibold">{{ item.title }}</h2>
                  <a
                    [href]="'?demo=' + item.slug"
                    class="text-muted-foreground hover:text-foreground font-mono text-xs underline underline-offset-4"
                  >
                    ?demo={{ item.slug }}
                  </a>
                </div>
                <div class="bg-dots bg-background/70 flex min-h-40 items-center justify-center p-6">
                  <ng-container *ngComponentOutlet="item.component" />
                </div>
              </section>
            }
          </div>
        </main>
      }
    </div>
  `,
})
export class App {
  protected readonly demos = ANGULAR_DEMOS;
  protected readonly demoSlug = new URLSearchParams(window.location.search).get("demo");
  protected readonly isEmbedded = window.parent !== window;
  protected readonly activeDemo = this.demoSlug
    ? ANGULAR_DEMOS.find((item) => item.slug === this.demoSlug) ?? null
    : null;
  private readonly stage = viewChild<ElementRef<HTMLElement>>("stage");

  constructor() {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: Partial<DemoDesignPayload> } | null;
      if (!data || data.type !== "gb:design-config" || !data.payload) return;
      applyDesignPayload(data.payload);
    };
    window.addEventListener("message", onMessage);

    afterNextRender(() => {
      notifyReady();
      observeDemoHeight(this.stage()?.nativeElement ?? null);
    });
  }
}
