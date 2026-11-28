# Dialog (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```html
<brn-dialog>
  <button brnDialogTrigger [class]="buttonVariants()">대화상자 열기</button>
  <ng-template brnDialogContent>
    <div [class]="dialogPopupVariants()">...</div>
  </ng-template>
</brn-dialog>
```

## responsive

```ts
@if (isMobile()) {
  <brn-sheet side="bottom">...</brn-sheet>
} @else {
  <brn-dialog>...</brn-dialog>
}
```
