# Tooltip (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```html
<brn-tooltip>
  <button brnTooltipTrigger>도움말</button>
  <span *brnTooltipContent [class]="tooltipPopupVariants()">단축키: Ctrl + K</span>
</brn-tooltip>
```
