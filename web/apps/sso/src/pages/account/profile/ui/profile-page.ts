import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  GbAlertDirective,
  GbButtonDirective,
  GbCardDirective,
  GbInputDirective,
  GbLabelDirective,
  GbSpinnerComponent,
} from "@goraebap/ui-angular";
import { SessionApi } from "@/entities/session";
import { ServerState } from "@/shared/lib/server-state";
import { PageHeader } from "@/shared/ui/page-header";

@Component({
  selector: "gb-profile-page",
  imports: [
    FormsModule,
    GbAlertDirective,
    GbButtonDirective,
    GbCardDirective,
    GbInputDirective,
    GbLabelDirective,
    GbSpinnerComponent,
    PageHeader,
  ],
  template: `
    <div class="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:px-8">
      <gb-page-header
        title="프로필"
        description="바꾼 이름은 연결된 모든 서비스에 바로 반영됩니다."
      />

      <form gbCard class="max-w-md space-y-4" (ngSubmit)="save()">
        @if (error()) {
          <div gbAlert variant="destructive">
            <p>{{ error() }}</p>
          </div>
        }
        @if (saved()) {
          <div gbAlert variant="success"><p>이름을 저장했습니다.</p></div>
        }
        <div class="space-y-1.5">
          <label gbLabel for="profile-name">표시 이름</label>
          <input
            gbInput
            id="profile-name"
            name="name"
            required
            maxlength="64"
            autocomplete="name"
            [(ngModel)]="name"
            (ngModelChange)="saved.set(false)"
          />
        </div>
        <div class="space-y-1.5">
          <p gbLabel>이메일</p>
          <p class="text-muted-foreground text-sm">{{ me.data()?.email }}</p>
        </div>
        <button gbButton type="submit" [loading]="saving()">
          @if (saving()) {
            <gb-spinner />
          }
          저장
        </button>
      </form>
    </div>
  `,
})
export class ProfilePage {
  private readonly session = inject(SessionApi);
  protected readonly me = inject(ServerState).watch(this.session.me);
  // 입력 중인 이름은 서버 데이터와 따로 둔 초안이다. 뒤에서 다시 읽어도 덮지 않는다.
  protected name = this.me.data()?.name ?? "";
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async save() {
    const name = this.name.trim();
    if (!name || this.saving()) return;
    this.error.set(null);
    this.saving.set(true);
    try {
      await this.session.updateName(name);
      this.saved.set(true);
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.saving.set(false);
    }
  }
}
