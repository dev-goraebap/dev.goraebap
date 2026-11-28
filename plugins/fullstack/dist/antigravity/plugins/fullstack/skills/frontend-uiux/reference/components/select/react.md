# Select (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@goraebap/ui-react/components/select";

export function Example() {
  return (
    <Select defaultValue="app">
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="app">App Theme</SelectItem>
        <SelectItem value="editorial">Editorial Theme</SelectItem>
      </SelectContent>
    </Select>
  );
}
```
