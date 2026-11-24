import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  model,
  viewChildren,
} from "@angular/core";
import {
  otpFieldInputVariants,
  otpFieldRootVariants,
} from "@goraebap/design-system/recipes/otp-field";

// 숫자 한 자리씩 받는 인증 코드 칸. 붙여넣기는 칸을 넘어 한 번에 채우고, 지우면 앞 칸으로 돌아간다.
@Component({
  selector: "gb-otp-field",
  template: `@for (index of slots(); track index) {
    <input
      #cell
      [class]="cellClass"
      inputmode="numeric"
      maxlength="1"
      [attr.autocomplete]="index === 0 ? 'one-time-code' : 'off'"
      [attr.aria-label]="label() + ' ' + (index + 1) + '번째 자리'"
      [disabled]="disabled()"
      [value]="value()[index] ?? ''"
      (input)="onInput(index, $event)"
      (keydown)="onKeydown(index, $event)"
      (paste)="onPaste($event)"
    />
  }`,
  host: { role: "group", "[attr.aria-label]": "label()", "[class]": "rootClass" },
})
export class GbOtpFieldComponent {
  readonly length = input(6);
  readonly label = input("인증 코드");
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model("");
  protected readonly rootClass = otpFieldRootVariants();
  protected readonly cellClass = otpFieldInputVariants();
  protected readonly slots = computed(() => Array.from({ length: this.length() }, (_, i) => i));
  private readonly cells = viewChildren<ElementRef<HTMLInputElement>>("cell");

  private focus(index: number) {
    this.cells()[Math.max(0, Math.min(index, this.length() - 1))]?.nativeElement.focus();
  }

  private write(index: number, digits: string) {
    const chars = this.value().padEnd(this.length(), " ").split("");
    digits.split("").forEach((digit, offset) => {
      if (index + offset < this.length()) chars[index + offset] = digit;
    });
    this.value.set(chars.join("").trimEnd());
  }

  protected onInput(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const digit = target.value.replace(/\D/g, "").slice(-1);
    target.value = digit;
    this.write(index, digit || " ");
    if (digit) this.focus(index + 1);
  }

  protected onKeydown(index: number, event: KeyboardEvent) {
    const current = (event.target as HTMLInputElement).value;
    if (event.key === "Backspace" && !current) this.focus(index - 1);
    if (event.key === "ArrowLeft") this.focus(index - 1);
    if (event.key === "ArrowRight") this.focus(index + 1);
  }

  protected onPaste(event: ClipboardEvent) {
    const digits = (event.clipboardData?.getData("text") ?? "").replace(/\D/g, "");
    if (!digits) return;
    event.preventDefault();
    this.value.set(digits.slice(0, this.length()));
    this.focus(Math.min(digits.length, this.length() - 1));
  }
}
