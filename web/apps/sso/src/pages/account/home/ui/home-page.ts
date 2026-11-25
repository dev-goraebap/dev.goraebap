import { DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import {
  GbAvatarComponent,
  GbBadgeDirective,
  GbCardDirective,
  GbIconComponent,
} from "@goraebap/ui-angular";
import { SessionApi } from "@/entities/session";
import { CONNECTED_SERVICES } from "@/shared/config/services";
import { ServerState } from "@/shared/lib/server-state";
import { PageHeader } from "@/shared/ui/page-header";

@Component({
  selector: "gb-home-page",
  imports: [
    DatePipe,
    GbAvatarComponent,
    GbBadgeDirective,
    GbCardDirective,
    GbIconComponent,
    PageHeader,
  ],
  template: `
    <div class="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:px-8">
      <gb-page-header
        title="계정 홈"
        description="한 번 로그인하면 연결된 모든 서비스를 이어서 씁니다."
      />

      @if (me.data(); as user) {
        <section gbCard class="flex items-center gap-4" aria-label="내 계정">
          <gb-avatar [name]="user.name" size="lg" shape="pill" />
          <div class="min-w-0 flex-1 space-y-1">
            <p class="truncate text-base font-semibold">{{ user.name }}</p>
            <p class="text-muted-foreground truncate text-sm">{{ user.email }}</p>
            @if (user.roles.length) {
              <div class="flex flex-wrap gap-1.5 pt-1">
                @for (role of user.roles; track role) {
                  <span gbBadge variant="outline">{{ role }}</span>
                }
              </div>
            }
          </div>
          <p class="text-muted-foreground hidden text-right text-xs sm:block">
            세션 만료<br />{{ user.expiresAt | date: "yyyy.MM.dd HH:mm" }}
          </p>
        </section>
      }

      <section class="space-y-3" aria-labelledby="services-title">
        <h2 id="services-title" class="text-sm font-semibold">연결된 서비스</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          @for (service of services; track service.name) {
            <a
              gbCard
              interactive
              padding="sm"
              [href]="service.href"
              target="_blank"
              rel="noreferrer"
              class="flex items-center justify-between gap-3"
            >
              <span class="min-w-0">
                <span class="block text-sm font-medium">{{ service.name }}</span>
                <span class="text-muted-foreground block truncate text-xs">{{
                  service.description
                }}</span>
              </span>
              <gb-icon name="chevronRight" class="text-muted-foreground" />
            </a>
          }
        </div>
      </section>
    </div>
  `,
})
export class HomePage {
  protected readonly me = inject(ServerState).watch(inject(SessionApi).me);
  protected readonly services = CONNECTED_SERVICES;
}
