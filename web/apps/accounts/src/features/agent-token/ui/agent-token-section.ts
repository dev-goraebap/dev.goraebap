import { DatePipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  GbAlertDirective,
  GbBadgeDirective,
  GbButtonDirective,
  GbCardDirective,
  GbDialog,
  GbIconComponent,
  GbInputDirective,
  GbLabelDirective,
  GbSkeletonDirective,
  GbSpinnerComponent,
} from "@goraebap/ui-angular";
import { ServerState } from "@/shared/lib/server-state";
import { confirmAction } from "@/shared/ui/confirm-dialog";
import {
  AgentTokenApi,
  LIFETIME_OPTIONS,
  type AgentToken,
  type AgentTokenLifetime,
} from "../api/agent-token";

@Component({
  selector: "gb-agent-token-section",
  imports: [
    DatePipe,
    FormsModule,
    GbAlertDirective,
    GbBadgeDirective,
    GbButtonDirective,
    GbCardDirective,
    GbIconComponent,
    GbInputDirective,
    GbLabelDirective,
    GbSkeletonDirective,
    GbSpinnerComponent,
  ],
  template: `
    <section gbCard class="space-y-5" aria-labelledby="agent-token-title">
      <div class="space-y-1">
        <h2 id="agent-token-title" class="text-base font-semibold">에이전트 토큰</h2>
        <p class="text-muted-foreground text-sm">
          에이전트가 내 권한으로 API와 MCP에 접근할 때 쓰는 토큰
        </p>
      </div>

      @if (error()) {
        <div gbAlert variant="destructive">
          <p>{{ error() }}</p>
        </div>
      }

      @if (secret()) {
        <div gbAlert variant="warning" class="space-y-2">
          <h5>새 토큰을 발급했습니다</h5>
          <p>이 화면을 벗어나면 다시 볼 수 없으니 지금 복사해 두세요.</p>
          <div class="flex items-center gap-2">
            <code
              class="bg-background min-w-0 flex-1 truncate rounded-md border px-2 py-1.5 font-mono text-xs"
              >{{ secret() }}</code
            >
            <button gbButton variant="outline" size="sm" type="button" (click)="copy()">
              <gb-icon [name]="copied() ? 'check' : 'copy'" />{{ copied() ? "복사됨" : "복사" }}
            </button>
          </div>
        </div>
      }

      <form class="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end" (ngSubmit)="create()">
        <div class="space-y-1.5">
          <label gbLabel for="token-name">용도</label>
          <input gbInput id="token-name" name="name" required [(ngModel)]="name" />
        </div>
        <div class="space-y-1.5">
          <label gbLabel for="token-agent">에이전트 이름</label>
          <input gbInput id="token-agent" name="agentName" [(ngModel)]="agentName" />
        </div>
        <div class="space-y-1.5">
          <label gbLabel for="token-lifetime">만료</label>
          <select gbInput id="token-lifetime" name="lifetime" [(ngModel)]="lifetime">
            @for (option of lifetimes; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>
        <button gbButton type="submit" [loading]="creating()">
          @if (creating()) {
            <gb-spinner />
          } @else {
            <gb-icon name="plus" />
          }
          발급
        </button>
      </form>

      @if (tokens.loading()) {
        <div class="space-y-2">
          <div gbSkeleton class="h-14"></div>
          <div gbSkeleton class="h-14"></div>
        </div>
      } @else if (tokens.error() && !tokens.data()) {
        <div gbAlert variant="destructive" class="flex items-center justify-between gap-3">
          <p>{{ tokens.error()?.message }}</p>
          <button gbButton variant="outline" size="sm" type="button" (click)="tokens.reload()">
            다시 시도
          </button>
        </div>
      } @else if (!tokens.data()?.length) {
        <p
          class="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm"
        >
          발급한 토큰이 없습니다
        </p>
      } @else {
        <ul class="divide-border divide-y rounded-lg border">
          @for (token of tokens.data(); track token.id) {
            <li class="flex items-center gap-3 px-4 py-3">
              <gb-icon name="key" class="text-muted-foreground" />
              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-2 text-sm font-medium">
                  <span class="truncate">{{ token.name }}</span>
                  @if (token.agentName) {
                    <span gbBadge variant="outline">{{ token.agentName }}</span>
                  }
                  @if (token.expired) {
                    <span gbBadge variant="destructive">만료됨</span>
                  }
                </p>
                <p class="text-muted-foreground mt-0.5 font-mono text-xs">
                  {{ token.prefix }}… ·
                  {{
                    token.expiresAt ? (token.expiresAt | date: "yyyy.MM.dd") + " 만료" : "만료 없음"
                  }}
                  ·
                  {{
                    token.lastUsedAt
                      ? (token.lastUsedAt | date: "yyyy.MM.dd HH:mm") + " 사용"
                      : "사용 기록 없음"
                  }}
                </p>
              </div>
              <button
                gbButton
                variant="ghost"
                size="icon"
                type="button"
                [loading]="revoking() === token.id"
                [attr.aria-label]="token.name + ' 토큰 폐기'"
                (click)="revoke(token)"
              >
                <gb-icon name="trash" />
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class AgentTokenSection {
  private readonly api = inject(AgentTokenApi);
  private readonly dialog = inject(GbDialog);
  protected readonly tokens = inject(ServerState).watch(this.api.list);
  protected readonly lifetimes = LIFETIME_OPTIONS;

  protected name = "";
  protected agentName = "";
  protected lifetime: AgentTokenLifetime = "DAYS_90";
  protected readonly creating = signal(false);
  protected readonly revoking = signal<string | null>(null);
  protected readonly secret = signal<string | null>(null);
  protected readonly copied = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async create() {
    if (!this.name.trim() || this.creating()) return;
    this.error.set(null);
    this.creating.set(true);
    try {
      const created = await this.api.create({
        name: this.name.trim(),
        agentName: this.agentName.trim(),
        lifetime: this.lifetime,
      });
      this.secret.set(created.secret);
      this.copied.set(false);
      this.name = "";
      this.agentName = "";
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.creating.set(false);
    }
  }

  protected async revoke(token: AgentToken) {
    const ok = await confirmAction(this.dialog, {
      title: "토큰을 폐기할까요?",
      description: `"${token.name}" 토큰을 쓰는 에이전트는 바로 접근할 수 없게 됩니다.`,
      confirmLabel: "폐기",
      destructive: true,
    });
    if (!ok) return;
    this.error.set(null);
    this.revoking.set(token.id);
    try {
      await this.api.revoke(token.id);
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.revoking.set(null);
    }
  }

  protected async copy() {
    const value = this.secret();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}
