# Radio Group (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { RadioGroup, RadioGroupItem } from "@goraebap/ui-react/components/radio-group";

export function Example() {
  return (
    <RadioGroup defaultValue="app">
      <label className="flex items-center gap-2"><RadioGroupItem value="app" />App Theme</label>
      <label className="flex items-center gap-2"><RadioGroupItem value="editorial" />Editorial Theme</label>
    </RadioGroup>
  );
}
```
