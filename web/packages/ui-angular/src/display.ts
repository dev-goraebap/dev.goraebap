import { Component, Directive, booleanAttribute, computed, input, signal } from "@angular/core";
import { cn } from "@goraebap/design-system/cn";
import { alertVariants, type AlertRecipeProps } from "@goraebap/design-system/recipes/alert";
import {
  avatarFallbackVariants,
  avatarImageVariants,
  avatarVariants,
  type AvatarRecipeProps,
} from "@goraebap/design-system/recipes/avatar";
import { badgeVariants, type BadgeRecipeProps } from "@goraebap/design-system/recipes/badge";
import { cardVariants, type CardRecipeProps } from "@goraebap/design-system/recipes/card";
import {
  separatorVariants,
  type SeparatorRecipeProps,
} from "@goraebap/design-system/recipes/separator";
import {
  skeletonVariants,
  type SkeletonRecipeProps,
} from "@goraebap/design-system/recipes/skeleton";

@Directive({ selector: "[gbCard]", host: { "data-slot": "card", "[class]": "classes()" } })
export class GbCardDirective {
  readonly padding = input<CardRecipeProps["padding"]>("default");
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(cardVariants({ padding: this.padding(), interactive: this.interactive() }), this.class()),
  );
}

@Directive({ selector: "[gbBadge]", host: { "data-slot": "badge", "[class]": "classes()" } })
export class GbBadgeDirective {
  readonly variant = input<BadgeRecipeProps["variant"]>("secondary");
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(badgeVariants({ variant: this.variant() }), this.class()),
  );
}

// 경고·안내 상자. 오류처럼 바로 알려야 하는 것만 role=alert, 나머지는 status로 읽힌다.
@Directive({
  selector: "[gbAlert]",
  host: {
    "data-slot": "alert",
    "[class]": "classes()",
    "[attr.role]": "variant() === 'destructive' ? 'alert' : 'status'",
  },
})
export class GbAlertDirective {
  readonly variant = input<AlertRecipeProps["variant"]>("default");
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(alertVariants({ variant: this.variant() }), this.class()),
  );
}

@Directive({
  selector: "[gbSeparator]",
  host: {
    role: "separator",
    "[attr.aria-orientation]": "orientation()",
    "[class]": "classes()",
  },
})
export class GbSeparatorDirective {
  readonly orientation = input<SeparatorRecipeProps["orientation"]>("horizontal");
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(separatorVariants({ orientation: this.orientation() }), this.class()),
  );
}

@Directive({
  selector: "[gbSkeleton]",
  host: { "aria-hidden": "true", "[class]": "classes()" },
})
export class GbSkeletonDirective {
  readonly shape = input<SkeletonRecipeProps["shape"]>("block");
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(skeletonVariants({ shape: this.shape() }), this.class()),
  );
}

// 사진이 없거나 읽지 못하면 이름의 첫 글자를 보인다.
@Component({
  selector: "gb-avatar",
  template: `@if (src() && !failed()) {
      <img [src]="src()" [alt]="name()" [class]="imageClass" (error)="failed.set(true)" />
    } @else {
      <span [class]="fallbackClass" aria-hidden="true">{{ initial() }}</span>
      <span class="sr-only">{{ name() }}</span>
    }`,
  host: { "data-slot": "avatar", "[class]": "classes()" },
})
export class GbAvatarComponent {
  readonly src = input<string | null | undefined>(null);
  readonly name = input("");
  readonly size = input<AvatarRecipeProps["size"]>("default");
  readonly shape = input<AvatarRecipeProps["shape"]>("default");
  protected readonly failed = signal(false);
  protected readonly imageClass = avatarImageVariants();
  protected readonly fallbackClass = avatarFallbackVariants();
  protected readonly initial = computed(() => this.name().trim().slice(0, 1).toUpperCase());
  protected readonly classes = computed(() =>
    avatarVariants({ size: this.size(), shape: this.shape() }),
  );
}
