# Drawer (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```html
<brn-sheet side="right">
  <button brnSheetTrigger>드로어 열기</button>
  <div *brnSheetContent [class]="drawerPopupVariants({ side: 'right' })">...</div>
</brn-sheet>
```
