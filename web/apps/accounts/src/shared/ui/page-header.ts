import { Component, input } from "@angular/core";

@Component({
  selector: "gb-page-header",
  template: `<h1 class="text-2xl font-semibold tracking-tight">{{ title() }}</h1>
    @if (description()) {
      <p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">{{ description() }}</p>
    }`,
  host: { class: "block border-b border-border pb-6" },
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input("");
}
