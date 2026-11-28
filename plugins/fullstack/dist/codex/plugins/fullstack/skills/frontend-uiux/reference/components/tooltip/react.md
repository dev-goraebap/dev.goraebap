# Tooltip (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@goraebap/ui-react/components/tooltip";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="sm" />}>도움말</TooltipTrigger>
        <TooltipContent>단축키: Ctrl + K</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```
