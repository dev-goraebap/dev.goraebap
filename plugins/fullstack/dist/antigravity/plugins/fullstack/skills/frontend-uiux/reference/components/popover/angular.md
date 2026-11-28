# Popover (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```html
<brn-popover>
  <button brnPopoverTrigger>필터 옵션</button>
  <div *brnPopoverContent [class]="popoverPopupVariants()">...</div>
</brn-popover>
```

## responsive

```ts
@if (isMobile()) {
  <brn-sheet side="bottom">...</brn-sheet>
} @else {
  <brn-popover>...</brn-popover>
}
```
