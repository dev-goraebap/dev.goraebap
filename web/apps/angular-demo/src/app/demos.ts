import { Menu, MenuItem, MenuTrigger } from "@angular/aria/menu";
import { DialogRef } from "@angular/cdk/dialog";
import { Component, inject, signal, type Type } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  GbAlertDirective,
  GbAvatarComponent,
  GbBadgeDirective,
  GbButtonDirective,
  GbCardDirective,
  GbDialog,
  GbDialogCloseDirective,
  GbDialogPopupDirective,
  GbIconComponent,
  GbInputDirective,
  GbLabelDirective,
  GbMenuDirective,
  GbMenuItemDirective,
  GbMenuLabelDirective,
  GbMenuSeparatorDirective,
  GbOtpFieldComponent,
  GbSeparatorDirective,
  GbSkeletonDirective,
  GbSpinnerComponent,
  GbTextareaDirective,
} from "@goraebap/ui-angular";

@Component({
  selector: "gb-demo-button",
  imports: [GbButtonDirective, GbIconComponent, GbSpinnerComponent],
  template: `
    <div class="flex flex-col items-center gap-4">
      <div class="flex flex-wrap items-center justify-center gap-2">
        <button gbButton type="button">저장</button>
        <button gbButton variant="secondary" type="button">임시 저장</button>
        <button gbButton variant="outline" type="button">미리보기</button>
        <button gbButton variant="ghost" type="button">취소</button>
        <button gbButton variant="destructive" type="button">삭제</button>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-2">
        <button gbButton size="sm" shape="pill" variant="outline" type="button">
          <gb-icon name="plus" class="size-3.5" />새 항목
        </button>
        <button gbButton type="button" [loading]="loading()" (click)="triggerLoading()">
          @if (loading()) {
            <gb-spinner />
            저장 중...
          } @else {
            비동기 저장 눌러보기
          }
        </button>
        <button gbButton size="icon" variant="outline" type="button" aria-label="보안">
          <gb-icon name="shield" />
        </button>
      </div>
    </div>
  `,
})
export class ButtonDemoComponent {
  protected readonly loading = signal(false);

  protected triggerLoading() {
    if (this.loading()) return;
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 1200);
  }
}

@Component({
  selector: "gb-demo-alert",
  imports: [GbAlertDirective],
  template: `
    <div class="w-full max-w-lg space-y-3">
      <div gbAlert variant="info">
        <h5>안내</h5>
        <p>변경 사항은 저장 후 모든 세션에 반영됩니다.</p>
      </div>
      <div gbAlert variant="success">
        <h5>저장 완료</h5>
        <p>설정을 정상적으로 반영했습니다.</p>
      </div>
      <div gbAlert variant="warning">
        <h5>주의</h5>
        <p>이 토큰은 화면을 벗어나면 다시 볼 수 없습니다.</p>
      </div>
      <div gbAlert variant="destructive">
        <h5>요청 실패</h5>
        <p>네트워크 연결을 확인한 뒤 다시 시도해 주세요.</p>
      </div>
    </div>
  `,
})
export class AlertDemoComponent {}

@Component({
  selector: "gb-demo-avatar",
  imports: [GbAvatarComponent],
  template: `
    <div class="flex items-center gap-4">
      <gb-avatar size="sm" name="고래밥" />
      <gb-avatar name="Goraebap" />
      <gb-avatar size="lg" name="Dev" />
      <gb-avatar size="lg" shape="pill" name="UI" />
    </div>
  `,
})
export class AvatarDemoComponent {}

@Component({
  selector: "gb-demo-badge",
  imports: [GbBadgeDirective],
  template: `
    <div class="flex flex-wrap items-center justify-center gap-2">
      <span gbBadge variant="default">기본</span>
      <span gbBadge variant="secondary">보조</span>
      <span gbBadge variant="outline">외곽선</span>
      <span gbBadge variant="muted">흐림</span>
      <span gbBadge variant="ghost">고스트</span>
      <span gbBadge variant="destructive">오류</span>
    </div>
  `,
})
export class BadgeDemoComponent {}

@Component({
  selector: "gb-demo-card",
  imports: [GbBadgeDirective, GbCardDirective],
  template: `
    <div class="grid w-full max-w-xl gap-4 sm:grid-cols-2">
      <section gbCard class="space-y-2">
        <h3 class="text-base font-semibold">기본 카드</h3>
        <p class="text-muted-foreground text-sm">관련 정보를 한 면에 묶어 보여 줍니다.</p>
        <p class="text-muted-foreground text-xs">
          같은 디자인 토큰과 반경 규칙을 React와 Angular가 함께 씁니다.
        </p>
      </section>
      <section gbCard interactive class="space-y-2">
        <h3 class="text-base font-semibold">인터랙티브 카드</h3>
        <p class="text-muted-foreground text-sm">마우스를 올려 호버 반응을 확인하세요.</p>
        <span gbBadge variant="secondary">클릭 가능</span>
      </section>
    </div>
  `,
})
export class CardDemoComponent {}

@Component({
  selector: "gb-demo-separator",
  imports: [GbSeparatorDirective],
  template: `
    <div class="w-full max-w-md space-y-4">
      <div class="space-y-2">
        <p class="text-sm font-medium">가로 구분선</p>
        <div gbSeparator></div>
      </div>
      <div class="flex h-6 items-center gap-3 text-sm">
        <span>문서</span>
        <div gbSeparator orientation="vertical"></div>
        <span>컴포넌트</span>
        <div gbSeparator orientation="vertical"></div>
        <span>레시피</span>
      </div>
    </div>
  `,
})
export class SeparatorDemoComponent {}

@Component({
  selector: "gb-demo-skeleton",
  imports: [GbSkeletonDirective],
  template: `
    <div class="w-full max-w-md space-y-3">
      <div class="flex items-center gap-3">
        <div gbSkeleton shape="circle" class="size-10 shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div gbSkeleton class="h-4 w-2/5"></div>
          <div gbSkeleton class="h-3 w-3/4"></div>
        </div>
      </div>
      <div gbSkeleton class="h-16 w-full"></div>
    </div>
  `,
})
export class SkeletonDemoComponent {}

@Component({
  selector: "gb-demo-input",
  imports: [FormsModule, GbInputDirective, GbLabelDirective],
  template: `
    <div class="w-full max-w-sm space-y-4">
      <div class="space-y-1.5">
        <label gbLabel for="ng-demo-email">이메일</label>
        <input
          gbInput
          id="ng-demo-email"
          type="email"
          [(ngModel)]="email"
          placeholder="name@example.com"
        />
      </div>
      <div class="space-y-1.5">
        <label gbLabel for="ng-demo-invalid">오류 상태</label>
        <input gbInput id="ng-demo-invalid" invalid value="invalid-email" />
      </div>
    </div>
  `,
})
export class InputDemoComponent {
  protected email = "dev@goraebap.xyz";
}

@Component({
  selector: "gb-demo-textarea",
  imports: [FormsModule, GbLabelDirective, GbTextareaDirective],
  template: `
    <div class="w-full max-w-md space-y-1.5">
      <div class="flex items-center justify-between">
        <label gbLabel for="ng-demo-bio">설명</label>
        <span class="text-muted-foreground text-xs tabular-nums">{{ text.length }} / 120</span>
      </div>
      <textarea
        gbTextarea
        id="ng-demo-bio"
        rows="3"
        maxlength="120"
        [(ngModel)]="text"
        placeholder="간단한 소개를 입력해 보세요."
      ></textarea>
    </div>
  `,
})
export class TextareaDemoComponent {
  protected text = "";
}

@Component({
  selector: "gb-demo-otp-field",
  imports: [GbOtpFieldComponent],
  template: `
    <div class="flex flex-col items-center gap-3">
      <gb-otp-field [length]="6" [(value)]="code" />
      <p class="text-muted-foreground font-mono text-xs">
        입력값: {{ code() || "______" }}
      </p>
    </div>
  `,
})
export class OtpFieldDemoComponent {
  protected readonly code = signal("");
}

@Component({
  selector: "gb-demo-dialog-content",
  imports: [GbButtonDirective, GbDialogCloseDirective, GbDialogPopupDirective, GbIconComponent],
  template: `
    <div gbDialogPopup class="relative w-full max-w-md space-y-4">
      <button gbDialogClose>
        <gb-icon name="close" />
      </button>
      <div class="space-y-1.5">
        <h2 class="text-lg font-semibold">변경 사항을 저장할까요?</h2>
        <p class="text-muted-foreground text-sm leading-relaxed">
          저장하면 React와 Angular 양쪽 디자인 시스템에 동일한 토큰이 적용됩니다.
        </p>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button gbButton variant="ghost" type="button" (click)="ref.close(false)">취소</button>
        <button gbButton type="button" (click)="ref.close(true)">저장</button>
      </div>
    </div>
  `,
})
export class DemoDialogContentComponent {
  protected readonly ref = inject(DialogRef<boolean>);
}

@Component({
  selector: "gb-demo-dialog",
  imports: [GbButtonDirective],
  template: `
    <div class="flex flex-col items-center gap-3">
      <button gbButton variant="outline" type="button" (click)="open()">대화상자 열기</button>
      @if (result() !== null) {
        <p class="text-muted-foreground text-xs">
          결과: {{ result() ? "저장함" : "취소함" }}
        </p>
      }
    </div>
  `,
})
export class DialogDemoComponent {
  private readonly dialog = inject(GbDialog);
  protected readonly result = signal<boolean | null>(null);

  protected open() {
    const ref = this.dialog.open<boolean, undefined, DemoDialogContentComponent>(
      DemoDialogContentComponent,
    );
    ref.closed.subscribe((value) => {
      if (typeof value === "boolean") this.result.set(value);
    });
  }
}

@Component({
  selector: "gb-demo-menu",
  imports: [
    Menu,
    MenuItem,
    MenuTrigger,
    GbButtonDirective,
    GbIconComponent,
    GbMenuDirective,
    GbMenuItemDirective,
    GbMenuLabelDirective,
    GbMenuSeparatorDirective,
  ],
  template: `
    <div class="flex flex-col items-center gap-3">
      <div class="relative inline-block">
        <button gbButton variant="outline" type="button" ngMenuTrigger [menu]="demoMenu">
          작업 메뉴
          <gb-icon name="chevronDown" />
        </button>
        <div ngMenu #demoMenu="ngMenu" gbMenu side="bottom" align="start" class="min-w-44">
          <div gbMenuLabel>문서 작업</div>
          <button ngMenuItem gbMenuItem value="복제" (click)="select('복제')">복제</button>
          <button ngMenuItem gbMenuItem value="링크 복사" (click)="select('링크 복사')">
            링크 복사
          </button>
          <div gbMenuSeparator></div>
          <button
            ngMenuItem
            gbMenuItem
            variant="destructive"
            value="삭제"
            (click)="select('삭제')"
          >
            삭제
          </button>
        </div>
      </div>
      @if (selected()) {
        <p class="text-muted-foreground text-xs">선택한 작업: {{ selected() }}</p>
      }
    </div>
  `,
})
export class MenuDemoComponent {
  protected readonly selected = signal<string | null>(null);

  protected select(item: string) {
    this.selected.set(item);
  }
}

export interface AngularDemoEntry {
  slug: string;
  title: string;
  component: Type<unknown>;
}

export const ANGULAR_DEMOS: AngularDemoEntry[] = [
  { slug: "button", title: "Button", component: ButtonDemoComponent },
  { slug: "alert", title: "Alert", component: AlertDemoComponent },
  { slug: "avatar", title: "Avatar", component: AvatarDemoComponent },
  { slug: "badge", title: "Badge", component: BadgeDemoComponent },
  { slug: "card", title: "Card", component: CardDemoComponent },
  { slug: "separator", title: "Separator", component: SeparatorDemoComponent },
  { slug: "skeleton", title: "Skeleton", component: SkeletonDemoComponent },
  { slug: "input", title: "Input", component: InputDemoComponent },
  { slug: "textarea", title: "Textarea", component: TextareaDemoComponent },
  { slug: "otp-field", title: "OTP Field", component: OtpFieldDemoComponent },
  { slug: "dialog", title: "Dialog", component: DialogDemoComponent },
  { slug: "menu", title: "Menu", component: MenuDemoComponent },
];
