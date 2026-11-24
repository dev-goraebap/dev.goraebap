import { Component, Directive, booleanAttribute, computed, input } from "@angular/core";
import { cn } from "@goraebap/design-system/cn";
import {
  buttonSpinnerVariants,
  buttonVariants,
  type ButtonRecipeProps,
} from "@goraebap/design-system/recipes/button";

// 버튼 레시피를 button·a 요소에 입힌다. 처리 중이면 누를 수 없게 하고 aria-busy로 알린다.
@Directive({
  selector: "button[gbButton], a[gbButton]",
  host: {
    "data-slot": "button",
    "[class]": "classes()",
    "[attr.data-loading]": "loading() ? '' : null",
    "[attr.aria-busy]": "loading() || null",
    "[attr.aria-disabled]": "loading() || null",
  },
})
export class GbButtonDirective {
  readonly variant = input<ButtonRecipeProps["variant"]>("default");
  readonly size = input<ButtonRecipeProps["size"]>("default");
  readonly shape = input<ButtonRecipeProps["shape"]>("default");
  readonly loading = input(false, { transform: booleanAttribute });
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(
      buttonVariants({ variant: this.variant(), size: this.size(), shape: this.shape() }),
      this.class(),
    ),
  );
}

// 버튼 안에 두는 처리 중 표시
@Component({
  selector: "gb-spinner",
  template: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" [attr.class]="classes">
    <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
  </svg>`,
  host: { class: "contents" },
})
export class GbSpinnerComponent {
  protected readonly classes = cn(buttonSpinnerVariants(), "size-4");
}

export { buttonVariants };
