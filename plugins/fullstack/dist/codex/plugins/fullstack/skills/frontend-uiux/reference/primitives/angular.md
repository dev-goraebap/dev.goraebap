# 기본 컴포넌트 (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## button-variants

출처: [web/packages/ui-angular/src/button.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/packages/ui-angular/src/button.ts)

```ts
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
```

React 어댑터와 같은 `buttonVariants` 레시피를 디렉티브의 호스트 클래스로 입힙니다. 그래서 두 프레임워크의 버튼이 같은 생김새를 냅니다.
