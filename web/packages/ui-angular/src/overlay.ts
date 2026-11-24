import { Menu } from "@angular/aria/menu";
import { Dialog, DialogRef, type DialogConfig } from "@angular/cdk/dialog";
import type { ComponentType } from "@angular/cdk/portal";
import {
  Directive,
  ElementRef,
  Injectable,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
} from "@angular/core";
import { cn } from "@goraebap/design-system/cn";
import {
  dialogBackdropVariants,
  dialogCloseButtonVariants,
  dialogPopupVariants,
} from "@goraebap/design-system/recipes/dialog";
import {
  menuItemVariants,
  menuLabelVariants,
  menuPopupVariants,
  menuSeparatorVariants,
  type MenuItemRecipeProps,
} from "@goraebap/design-system/recipes/menu";

// 레시피는 열릴 때 data-starting-style에서 시작해 원래 모양으로 옮겨 가는 전환을 쓴다.
// 첫 그림에 그 속성을 달았다가 다음 그림에서 떼어 같은 전환을 낸다.
function enterTransition(element: HTMLElement) {
  element.setAttribute("data-starting-style", "");
  afterNextRender(() =>
    requestAnimationFrame(() => element.removeAttribute("data-starting-style")),
  );
}

// 대화상자 열기. 포커스 가두기·Esc·배경 누르기 닫기·포커스 되돌리기는 CDK Dialog가 맡는다.
@Injectable({ providedIn: "root" })
export class GbDialog {
  private readonly dialog = inject(Dialog);

  open<R, D, C>(component: ComponentType<C>, config: DialogConfig<D, DialogRef<R, C>> = {}) {
    return this.dialog.open<R, D, C>(component, {
      // CDK는 클래스를 토큰 하나씩 받는다.
      backdropClass: dialogBackdropVariants().split(" "),
      ariaModal: true,
      ...config,
    });
  }
}

// 대화상자 내용의 바깥 면
@Directive({ selector: "[gbDialogPopup]", host: { "[class]": "classes()" } })
export class GbDialogPopupDirective {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn(dialogPopupVariants(), this.class()));
  constructor() {
    enterTransition(inject(ElementRef).nativeElement);
  }
}

@Directive({
  selector: "button[gbDialogClose]",
  host: {
    type: "button",
    "aria-label": "닫기",
    "[class]": "classes",
    "(click)": "ref.close()",
  },
})
export class GbDialogCloseDirective {
  protected readonly ref = inject(DialogRef);
  protected readonly classes = dialogCloseButtonVariants();
}

const MENU_SIDE = { top: "bottom-full mb-1.5", bottom: "top-full mt-1.5" } as const;
const MENU_ALIGN = { start: "left-0", end: "right-0" } as const;

// 메뉴는 Angular Aria(ngMenu, ngMenuItem, ngMenuTrigger)가 키보드·포커스·ARIA 속성을 맡고, 여기서는 모양과 자리만 입힌다.
// Aria는 위치를 잡지 않으므로, 트리거와 메뉴를 relative 상자에 함께 두고 side·align으로 펼칠 쪽을 고른다.
@Directive({ selector: "[ngMenu][gbMenu]", host: { "[class]": "classes()" } })
export class GbMenuDirective {
  readonly side = input<keyof typeof MENU_SIDE>("bottom");
  readonly align = input<keyof typeof MENU_ALIGN>("start");
  readonly class = input<string>("");
  private readonly menu = inject(Menu, { self: true });
  private readonly element = inject(ElementRef).nativeElement as HTMLElement;
  protected readonly classes = computed(() =>
    cn(
      menuPopupVariants(),
      "absolute data-[visible=false]:hidden",
      MENU_SIDE[this.side()],
      MENU_ALIGN[this.align()],
      this.class(),
    ),
  );
  constructor() {
    // 열릴 때마다 레시피의 등장 전환을 낸다.
    effect(() => {
      if (!this.menu.visible()) return;
      this.element.setAttribute("data-starting-style", "");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => this.element.removeAttribute("data-starting-style")),
      );
    });
  }
}

// Aria가 강조한 항목(data-active)을 레시피의 강조 모양과 같게 칠한다.
@Directive({ selector: "[ngMenuItem][gbMenuItem]", host: { "[class]": "classes()" } })
export class GbMenuItemDirective {
  readonly variant = input<MenuItemRecipeProps["variant"]>("default");
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(
      menuItemVariants({ variant: this.variant() }),
      this.variant() === "destructive"
        ? "data-[active=true]:bg-destructive/10"
        : "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
      this.class(),
    ),
  );
}

@Directive({ selector: "[gbMenuLabel]", host: { "[class]": "classes" } })
export class GbMenuLabelDirective {
  protected readonly classes = menuLabelVariants();
}

@Directive({
  selector: "[gbMenuSeparator]",
  host: { role: "separator", "[class]": "classes" },
})
export class GbMenuSeparatorDirective {
  protected readonly classes = menuSeparatorVariants();
}
