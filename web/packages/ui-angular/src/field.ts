import { Directive, booleanAttribute, computed, input } from "@angular/core";
import { cn } from "@goraebap/design-system/cn";
import { inputVariants, type InputRecipeProps } from "@goraebap/design-system/recipes/input";
import { textareaVariants } from "@goraebap/design-system/recipes/textarea";

// 입력 칸. invalid이면 aria-invalid도 함께 단다.
@Directive({
  selector: "input[gbInput], select[gbInput]",
  host: {
    "data-slot": "input",
    "[class]": "classes()",
    "[attr.aria-invalid]": "invalid() || null",
  },
})
export class GbInputDirective {
  readonly size = input<InputRecipeProps["size"]>("default");
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(inputVariants({ size: this.size(), invalid: this.invalid() }), this.class()),
  );
}

@Directive({
  selector: "textarea[gbTextarea]",
  host: {
    "data-slot": "textarea",
    "[class]": "classes()",
    "[attr.aria-invalid]": "invalid() || null",
  },
})
export class GbTextareaDirective {
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(textareaVariants({ invalid: this.invalid() }), this.class()),
  );
}

// 칸 이름. 레시피가 따로 없어 디자인 시스템의 글자 토큰만 쓴다.
@Directive({
  selector: "label[gbLabel]",
  host: { "[class]": "classes()" },
})
export class GbLabelDirective {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn("text-sm font-medium text-foreground", this.class()),
  );
}
