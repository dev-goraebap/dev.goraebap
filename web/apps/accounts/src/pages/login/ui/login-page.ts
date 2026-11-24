import { Component, OnInit, computed, inject, input, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import {
  GbAlertDirective,
  GbButtonDirective,
  GbCardDirective,
  GbInputDirective,
  GbLabelDirective,
  GbOtpFieldComponent,
  GbSpinnerComponent,
} from "@goraebap/ui-angular";
import { SessionApi } from "@/entities/session";
import { resolveSafeNextUrl } from "@/shared/lib/safe-redirect";

type Step = "setup" | "email" | "code";

@Component({
  selector: "gb-login-page",
  imports: [
    FormsModule,
    GbAlertDirective,
    GbButtonDirective,
    GbCardDirective,
    GbInputDirective,
    GbLabelDirective,
    GbOtpFieldComponent,
    GbSpinnerComponent,
  ],
  template: `
    <main class="flex min-h-dvh items-center justify-center px-6 py-12">
      <section gbCard class="w-full max-w-sm space-y-6 shadow-xs" aria-labelledby="login-title">
        <header class="space-y-1.5">
          <p class="text-muted-foreground font-mono text-xs">goraebap accounts</p>
          <h1 id="login-title" class="text-xl font-semibold tracking-tight">
            {{ step() === "setup" ? "최초 관리자 설정" : "로그인" }}
          </h1>
          <p class="text-muted-foreground text-sm">{{ lead() }}</p>
        </header>

        @if (safeNext()) {
          <p
            class="bg-secondary/70 text-muted-foreground truncate rounded-md px-3 py-2 font-mono text-xs"
          >
            돌아갈 곳: {{ safeNext() }}
          </p>
        }
        @if (notice()) {
          <div gbAlert variant="info">
            <p>{{ notice() }}</p>
          </div>
        }
        @if (error()) {
          <div gbAlert variant="destructive">
            <p>{{ error() }}</p>
          </div>
        }

        @switch (step()) {
          @case ("setup") {
            <form class="space-y-4" (ngSubmit)="createAdmin()">
              <div class="space-y-1.5">
                <label gbLabel for="admin-name">이름</label>
                <input
                  gbInput
                  id="admin-name"
                  name="name"
                  required
                  maxlength="64"
                  autocomplete="name"
                  [(ngModel)]="adminName"
                />
              </div>
              <div class="space-y-1.5">
                <label gbLabel for="admin-email">이메일</label>
                <input
                  gbInput
                  id="admin-email"
                  name="email"
                  type="email"
                  required
                  autocomplete="email"
                  [(ngModel)]="email"
                />
              </div>
              <button gbButton type="submit" class="w-full" [loading]="pending()">
                @if (pending()) {
                  <gb-spinner />
                }
                관리자 계정 만들고 코드 받기
              </button>
            </form>
          }
          @case ("email") {
            <form class="space-y-4" (ngSubmit)="requestCode()">
              <div class="space-y-1.5">
                <label gbLabel for="email">이메일</label>
                <input
                  gbInput
                  id="email"
                  name="email"
                  type="email"
                  required
                  autocomplete="email"
                  [(ngModel)]="email"
                />
              </div>
              <button gbButton type="submit" class="w-full" [loading]="pending()">
                @if (pending()) {
                  <gb-spinner />
                }
                인증 코드 받기
              </button>
            </form>
          }
          @case ("code") {
            <form class="space-y-4" (ngSubmit)="verify()">
              <div class="space-y-2">
                <p gbLabel>{{ email }}로 보낸 코드</p>
                <gb-otp-field [(value)]="code" />
              </div>
              <button gbButton type="submit" class="w-full" [loading]="pending()">
                @if (pending()) {
                  <gb-spinner />
                }
                로그인
              </button>
              <button gbButton variant="ghost" type="button" class="w-full" (click)="changeEmail()">
                다른 이메일로 받기
              </button>
            </form>
          }
        }
      </section>
    </main>
  `,
})
export class LoginPage implements OnInit {
  // 로그인 뒤 돌아갈 주소(검색 조건 next). 허용한 도메인만 따른다.
  readonly next = input<string>();
  private readonly session = inject(SessionApi);
  private readonly router = inject(Router);

  protected readonly safeNext = computed(() => resolveSafeNextUrl(this.next()));
  protected readonly step = signal<Step>("email");
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected adminName = "";
  protected email = "";
  protected code = "";

  protected readonly lead = computed(() =>
    this.step() === "setup"
      ? "아직 등록된 계정이 없습니다. 첫 관리자 계정을 만들어 주세요."
      : this.safeNext()
        ? "로그인하면 요청한 서비스로 바로 돌아갑니다."
        : "이메일 인증 코드로 로그인합니다.",
  );

  async ngOnInit() {
    if (await this.session.setupNeeded()) this.step.set("setup");
  }

  private async run(action: () => Promise<void>) {
    if (this.pending()) return;
    this.error.set(null);
    this.pending.set(true);
    try {
      await action();
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.pending.set(false);
    }
  }

  protected createAdmin() {
    return this.run(async () => {
      const email = this.email.trim();
      await this.session.createFirstAdmin(this.adminName.trim(), email);
      await this.session.requestCode(email);
      this.notice.set("관리자 계정을 만들고 인증 코드를 보냈습니다. 서버 로그를 확인해 주세요.");
      this.step.set("code");
    });
  }

  protected requestCode() {
    return this.run(async () => {
      await this.session.requestCode(this.email.trim());
      this.notice.set("인증 코드를 보냈습니다. 메일함이나 로컬 서버 로그를 확인해 주세요.");
      this.step.set("code");
    });
  }

  protected verify() {
    return this.run(async () => {
      const me = await this.session.verifyCode(this.email.trim(), this.code.trim());
      const next = this.safeNext();
      if (me && !me.onboarded) {
        await this.router.navigate(["/onboarding"], { queryParams: { next: next ?? undefined } });
      } else if (next) {
        window.location.assign(next);
      } else {
        await this.router.navigateByUrl("/");
      }
    });
  }

  protected changeEmail() {
    this.code = "";
    this.notice.set(null);
    this.step.set("email");
  }
}
