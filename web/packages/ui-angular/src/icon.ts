import { Component, computed, input } from "@angular/core";
import { cn } from "@goraebap/design-system/cn";

// 선 아이콘 몇 가지(Lucide, ISC 라이선스의 경로). 장식이면 aria-hidden, 뜻이 있으면 label을 준다.
const PATHS = {
  user: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8"],
  shield: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  ],
  key: [
    "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4",
    "m21 2-9.6 9.6",
    "M7.5 13a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11",
  ],
  home: [
    "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
    "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  ],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  chevronDown: ["m6 9 6 6 6-6"],
  chevronRight: ["m9 18 6-6-6-6"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  copy: [
    "M8 8h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z",
    "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
  ],
  check: ["M20 6 9 17l-5-5"],
  plus: ["M5 12h14", "M12 5v14"],
  trash: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"],
  mail: [
    "M22 7 13.03 12.7a1.94 1.94 0 0 1-2.06 0L2 7",
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
  ],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
} as const;

export type GbIconName = keyof typeof PATHS;

@Component({
  selector: "gb-icon",
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    [attr.class]="classes()"
    [attr.aria-hidden]="label() ? null : 'true'"
    [attr.aria-label]="label() || null"
    [attr.role]="label() ? 'img' : null"
  >
    @for (path of paths(); track path) {
      <path [attr.d]="path" />
    }
  </svg>`,
  host: { class: "contents" },
})
export class GbIconComponent {
  readonly name = input.required<GbIconName>();
  readonly label = input("");
  readonly class = input<string>("");
  protected readonly paths = computed(() => PATHS[this.name()]);
  protected readonly classes = computed(() => cn("size-4 shrink-0", this.class()));
}
