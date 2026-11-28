# Menu (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```html
<button [brnMenuTriggerFor]="menu">작업 메뉴</button>
<ng-template #menu>
  <div brnMenu [class]="menuPopupVariants()">
    <button brnMenuItem [class]="menuItemVariants()">복제</button>
  </div>
</ng-template>
```
