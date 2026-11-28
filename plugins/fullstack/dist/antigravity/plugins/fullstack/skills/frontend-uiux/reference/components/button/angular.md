# Button (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```ts
import { Directive, computed, input } from "@angular/core";
import { buttonVariants, type ButtonRecipeProps } from "@goraebap/design-system/recipes/button";

@Directive({
  selector: "button[gbButton], a[gbButton]",
  host: { "[class]": "computedClass()" },
})
export class GbButtonDirective {
  variant = input<ButtonRecipeProps["variant"]>("default");
  size = input<ButtonRecipeProps["size"]>("default");
  shape = input<ButtonRecipeProps["shape"]>("default");
  computedClass = computed(() =>
    buttonVariants({ variant: this.variant(), size: this.size(), shape: this.shape() }),
  );
}
```
