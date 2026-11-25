import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, inject } from "@angular/core";
import { GbButtonDirective, GbDialog, GbDialogPopupDirective } from "@goraebap/ui-angular";
import { firstValueFrom } from "rxjs";

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
}

// 되돌리기 어려운 동작 앞의 확인 창. 취소가 먼저 초점을 받는다.
@Component({
  selector: "gb-confirm-dialog",
  imports: [GbButtonDirective, GbDialogPopupDirective],
  template: `<div gbDialogPopup>
    <h2 id="confirm-title" class="text-base font-semibold">{{ data.title }}</h2>
    <p id="confirm-description" class="text-muted-foreground mt-2 text-sm leading-relaxed">
      {{ data.description }}
    </p>
    <div class="mt-6 flex justify-end gap-2">
      <button gbButton variant="outline" type="button" cdkFocusInitial (click)="ref.close(false)">
        취소
      </button>
      <button
        gbButton
        [variant]="data.destructive ? 'destructive' : 'default'"
        type="button"
        (click)="ref.close(true)"
      >
        {{ data.confirmLabel }}
      </button>
    </div>
  </div>`,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}

export async function confirmAction(dialog: GbDialog, options: ConfirmOptions): Promise<boolean> {
  const ref = dialog.open<boolean, ConfirmOptions, ConfirmDialog>(ConfirmDialog, {
    data: options,
    role: "alertdialog",
    ariaLabelledBy: "confirm-title",
    ariaDescribedBy: "confirm-description",
  });
  return (await firstValueFrom(ref.closed)) === true;
}
