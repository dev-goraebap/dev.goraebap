import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { GbIconComponent, type GbIconName } from "@goraebap/ui-angular";
import { CONNECTED_SERVICES } from "@/shared/config/services";
import { AppShell } from "@/shared/ui/app-shell";
import { UserMenu } from "./user-menu";

interface NavItem {
  path: string;
  label: string;
  icon: GbIconName;
  exact: boolean;
}

const NAV: NavItem[] = [
  { path: "/", label: "계정 홈", icon: "home", exact: true },
  { path: "/profile", label: "프로필", icon: "user", exact: false },
  { path: "/security", label: "보안", icon: "shield", exact: false },
];

// 계정 앱의 셸. 메뉴·연결된 서비스·사용자 메뉴처럼 업무를 아는 부분을 공용 앱 셸 틀에 넣는다.
@Component({
  selector: "gb-account-shell",
  imports: [AppShell, GbIconComponent, RouterLink, RouterLinkActive, RouterOutlet, UserMenu],
  template: `
    <gb-app-shell>
      <a shellBrand routerLink="/" class="flex items-center gap-2.5 px-2">
        <span
          class="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-semibold"
          >g</span
        >
        <span class="min-w-0">
          <span class="block text-sm font-semibold">goraebap sso</span>
          <span class="text-muted-foreground block font-mono text-xs">*.goraebap.xyz</span>
        </span>
      </a>

      @for (item of nav; track item.path) {
        <a
          shellNav
          [routerLink]="item.path"
          routerLinkActive="bg-background text-foreground shadow-xs"
          [routerLinkActiveOptions]="{ exact: item.exact }"
          ariaCurrentWhenActive="page"
          class="text-muted-foreground hover:text-foreground flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors"
        >
          <gb-icon [name]="item.icon" />{{ item.label }}
        </a>
      }

      <div shellAside class="space-y-1.5 pt-2">
        <p class="text-muted-foreground px-3 text-xs font-medium">연결된 서비스</p>
        @for (service of services; track service.name) {
          <a
            [href]="service.href"
            target="_blank"
            rel="noreferrer"
            class="text-muted-foreground hover:text-foreground flex h-8 items-center justify-between rounded-lg px-3 text-sm transition-colors"
          >
            {{ service.name }}<gb-icon name="chevronRight" class="size-3.5" />
          </a>
        }
      </div>

      <gb-user-menu shellFooter side="top" />

      <ng-container ngProjectAs="[shellMobileBar]">
        <a routerLink="/" class="text-sm font-semibold">goraebap sso</a>
        <gb-user-menu side="bottom" compact />
      </ng-container>

      @for (item of nav; track item.path) {
        <a
          shellBottomNav
          [routerLink]="item.path"
          routerLinkActive="text-foreground"
          [routerLinkActiveOptions]="{ exact: item.exact }"
          ariaCurrentWhenActive="page"
          class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-1 text-xs"
        >
          <gb-icon [name]="item.icon" />{{ item.label }}
        </a>
      }

      <router-outlet />
    </gb-app-shell>
  `,
})
export class AccountShell {
  protected readonly nav = NAV;
  protected readonly services = CONNECTED_SERVICES;
}
