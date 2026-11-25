# Collapsible (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@goraebap/ui-react/components/collapsible";

export function Example() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>고급 설정 보기</CollapsibleTrigger>
      <CollapsibleContent>보조 설정 내용</CollapsibleContent>
    </Collapsible>
  );
}
```
