# Skeleton (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Skeleton } from "@goraebap/ui-react/components/skeleton";

export function Example() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton shape="circle" className="size-10" />
      <Skeleton shape="line" className="w-1/2" />
    </div>
  );
}
```
