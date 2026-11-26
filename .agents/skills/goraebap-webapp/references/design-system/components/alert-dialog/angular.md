# Alert Dialog (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```html
<brn-alert-dialog>
  <button brnAlertDialogTrigger>프로젝트 삭제</button>
  <div *brnAlertDialogContent [class]="alertDialogPopupVariants()">...</div>
</brn-alert-dialog>
```
