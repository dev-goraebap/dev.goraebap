import { Component, computed, inject, input, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import {
  GbAlertDirective,
  GbButtonDirective,
  GbCardDirective,
  GbInputDirective,
  GbLabelDirective,
  GbSpinnerComponent,
} from "@goraebap/ui-angular";
import { SessionApi, type AuthMe } from "@/entities/session";
import { resolveSafeNextUrl } from "@/shared/lib/safe-redirect";

@Component({
  selector: "gb-onboarding-page",
  imports: [
    FormsModule,
    GbAlertDirective,
    GbButtonDirective,
    GbCardDirective,
    GbInputDirective,
    GbLabelDirective,
    GbSpinnerComponent,
  ],
  template: `
    <main class="flex min-h-dvh items-center justify-center px-6 py-12">
      <section
        gbCard
        class="w-full max-w-sm space-y-6 shadow-xs"
        aria-labelledby="onboarding-title"
      >
        <header class="space-y-1.5">
          <p class="text-muted-foreground font-mono text-xs">goraebap accounts</p>
          <h1 id="onboarding-title" class="text-xl font-semibold tracking-tight">처음 오셨네요</h1>
          <p class="text-muted-foreground text-sm">
            연결된 모든 서비스에서 보일 이름을 정해 주세요.
          </p>
        </header>
        @if (error()) {
          <div gbAlert variant="destructive">
            <p>{{ error() }}</p>
          </div>
        }
        <form class="space-y-4" (ngSubmit)="submit()">
          <div class="space-y-1.5">
            <label gbLabel for="display-name">표시 이름</label>
            <input
              gbInput
              id="display-name"
              name="name"
              required
              maxlength="64"
              autocomplete="name"
              [(ngModel)]="name"
            />
          </div>
          <button gbButton type="submit" class="w-full" [loading]="pending()">
            @if (pending()) {
              <gb-spinner />
            }
            시작하기
          </button>
        </form>
      </section>
    </main>
  `,
})
export class OnboardingPage {
  readonly next = input<string>();
  private readonly session = inject(SessionApi);
  private readonly router = inject(Router);
  private readonly me = inject(ActivatedRoute).snapshot.data["me"] as AuthMe;

  protected readonly safeNext = computed(() => resolveSafeNextUrl(this.next()));
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected name = this.me.name ?? "";

  protected async submit() {
    if (this.pending()) return;
    this.error.set(null);
    this.pending.set(true);
    try {
      const name = this.name.trim();
      if (name && name !== this.me.name) await this.session.updateName(name);
      await this.session.completeOnboarding();
      const next = this.safeNext();
      if (next) window.location.assign(next);
      else await this.router.navigateByUrl("/");
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.pending.set(false);
    }
  }
}
