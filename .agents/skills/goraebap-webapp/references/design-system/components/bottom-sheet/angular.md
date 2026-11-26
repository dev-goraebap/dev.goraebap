# Bottom Sheet (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```html
<brn-sheet side="bottom">
  <button brnSheetTrigger [class]="buttonVariants()">바텀시트 열기</button>
  <div *brnSheetContent [class]="bottomSheetPopupVariants()">
    <div [class]="bottomSheetHandleVariants()"></div>
    <div [class]="bottomSheetContentVariants()">...</div>
  </div>
</brn-sheet>
```
