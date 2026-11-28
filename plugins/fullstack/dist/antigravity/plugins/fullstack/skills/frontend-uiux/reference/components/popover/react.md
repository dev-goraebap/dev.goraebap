# Popover (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@goraebap/ui-react/components/popover";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>필터 옵션</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>표시 범위</PopoverTitle>
        <PopoverDescription>트리거 근처에 보조 설정을 띄웁니다.</PopoverDescription>
      </PopoverContent>
    </Popover>
  );
}
```

## responsive

```tsx
<ResponsivePopover>
  <ResponsivePopoverTrigger render={<Button variant="outline" />}>표시 옵션</ResponsivePopoverTrigger>
  <ResponsivePopoverContent>
    <ResponsivePopoverTitle>표시 옵션</ResponsivePopoverTitle>
  </ResponsivePopoverContent>
</ResponsivePopover>
```
