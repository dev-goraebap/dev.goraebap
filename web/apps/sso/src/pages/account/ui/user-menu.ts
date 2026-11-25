import { Menu, MenuContent, MenuItem, MenuTrigger } from "@angular/aria/menu";
import { Component, booleanAttribute, inject, input, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
  GbAvatarComponent,
  GbIconComponent,
  GbMenuDirective,
  GbMenuItemDirective,
  GbMenuLabelDirective,
  GbMenuSeparatorDirective,
} from "@goraebap/ui-angular";
import { SessionApi } from "@/entities/session";
import { ServerState } from "@/shared/lib/server-state";
import { Theme } from "@/shared/lib/theme";

type Action = "theme" | "logout";

// 내 계정 메뉴. 사이드바 바닥(위로 펼침)과 휴대폰 앱 바(아래로 펼침)에 따로 둔다.
@Component({
  selector: "gb-user-menu",
  imports: [
    GbAvatarComponent,
    GbIconComponent,
    GbMenuDirective,
    GbMenuItemDirective,
    GbMenuLabelDirective,
    GbMenuSeparatorDirective,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
  ],
  template: `
    <button
      type="button"
      ngMenuTrigger
      [menu]="menu"
      aria-label="내 계정 메뉴"
      class="hover:bg-background flex w-full min-w-0 items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors"
    >
      <gb-avatar [name]="me.data()?.name ?? ''" size="sm" shape="pill" />
      @if (!compact()) {
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">{{ me.data()?.name }}</span>
          <span class="text-muted-foreground block truncate text-xs">{{ me.data()?.email }}</span>
        </span>
      }
    </button>
    <div
      ngMenu
      gbMenu
      #menu="ngMenu"
      [side]="side()"
      [align]="compact() ? 'end' : 'start'"
      class="w-56"
      (itemSelected)="run($event)"
    >
      <ng-template ngMenuContent>
        <p gbMenuLabel>{{ me.data()?.email }}</p>
        <div ngMenuItem gbMenuItem value="theme">
          {{ theme.dark() ? "라이트 모드" : "다크 모드" }}
        </div>
        <div gbMenuSeparator></div>
        <div ngMenuItem gbMenuItem variant="destructive" value="logout">
          <gb-icon name="logout" />로그아웃
        </div>
      </ng-template>
    </div>
  `,
  host: { class: "relative block" },
})
export class UserMenu {
  readonly side = input<"top" | "bottom">("top");
  readonly compact = input(false, { transform: booleanAttribute });
  private readonly session = inject(SessionApi);
  private readonly router = inject(Router);
  protected readonly theme = inject(Theme);
  protected readonly me = inject(ServerState).watch(this.session.me);
  private readonly busy = signal(false);

  protected async run(action: Action | undefined) {
    if (action === "theme") this.theme.toggle();
    if (action === "logout" && !this.busy()) {
      this.busy.set(true);
      try {
        await this.session.logout();
        await this.router.navigateByUrl("/login");
      } finally {
        this.busy.set(false);
      }
    }
  }
}
