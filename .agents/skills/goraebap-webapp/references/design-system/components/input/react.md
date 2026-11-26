# Input (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Input } from "@goraebap/ui-react/components/input";

export function Example() {
  return (
    <div className="space-y-3">
      <Input placeholder="name@goraebap.xyz" />
      <Input invalid defaultValue="invalid-email" />
    </div>
  );
}
```
