# Menu (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@goraebap/ui-react/components/menu";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" size="sm" />}>작업 메뉴</MenuTrigger>
      <MenuContent>
        <MenuItem>복제</MenuItem>
        <MenuItem>이름 바꾸기</MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">삭제</MenuItem>
      </MenuContent>
    </Menu>
  );
}
```
