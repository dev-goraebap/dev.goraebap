import { DatePipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
  GbAlertDirective,
  GbButtonDirective,
  GbCardDirective,
  GbDialog,
  GbSpinnerComponent,
} from "@goraebap/ui-angular";
import { SessionApi } from "@/entities/session";
import { AgentTokenSection } from "@/features/agent-token";
import { ServerState } from "@/shared/lib/server-state";
import { confirmAction } from "@/shared/ui/confirm-dialog";
import { PageHeader } from "@/shared/ui/page-header";

@Component({
  selector: "gb-security-page",
  imports: [
    AgentTokenSection,
    DatePipe,
    GbAlertDirective,
    GbButtonDirective,
    GbCardDirective,
    GbSpinnerComponent,
    PageHeader,
  ],
  template: `
    <div class="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:px-8">
      <gb-page-header title="보안" description="로그인한 기기와 에이전트 접근 토큰을 관리합니다." />

      <section gbCard class="space-y-4" aria-labelledby="session-title">
        <div class="space-y-1">
          <h2 id="session-title" class="text-base font-semibold">로그인 세션</h2>
          <p class="text-muted-foreground text-sm">
            지금 세션은 {{ me.data()?.expiresAt | date: "yyyy.MM.dd HH:mm" }}에 끝납니다.
          </p>
        </div>
        @if (error()) {
          <div gbAlert variant="destructive">
            <p>{{ error() }}</p>
          </div>
        }
        <div class="flex flex-wrap gap-2">
          <button
            gbButton
            variant="outline"
            size="sm"
            type="button"
            [loading]="busy() === 'one'"
            (click)="logout(false)"
          >
            @if (busy() === "one") {
              <gb-spinner />
            }
            이 기기에서 로그아웃
          </button>
          <button
            gbButton
            variant="destructive"
            size="sm"
            type="button"
            [loading]="busy() === 'all'"
            (click)="logout(true)"
          >
            @if (busy() === "all") {
              <gb-spinner />
            }
            모든 기기에서 로그아웃
          </button>
        </div>
      </section>

      <gb-agent-token-section />
    </div>
  `,
})
export class SecurityPage {
  private readonly session = inject(SessionApi);
  private readonly router = inject(Router);
  private readonly dialog = inject(GbDialog);
  protected readonly me = inject(ServerState).watch(this.session.me);
  protected readonly busy = signal<"one" | "all" | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async logout(all: boolean) {
    if (this.busy()) return;
    if (
      all &&
      !(await confirmAction(this.dialog, {
        title: "모든 기기에서 로그아웃할까요?",
        description: "이 계정으로 로그인한 모든 브라우저와 기기의 세션이 끝납니다.",
        confirmLabel: "모두 로그아웃",
        destructive: true,
      }))
    ) {
      return;
    }
    this.error.set(null);
    this.busy.set(all ? "all" : "one");
    try {
      await this.session.logout(all);
      await this.router.navigateByUrl("/login");
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.busy.set(null);
    }
  }
}
