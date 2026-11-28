# Tabs (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";

export function Example() {
  return (
    <Tabs defaultValue="react">
      <TabsList>
        <TabsTrigger value="react">React</TabsTrigger>
        <TabsTrigger value="angular">Angular</TabsTrigger>
      </TabsList>
      <TabsContent value="react">Base UI + 스타일 레시피</TabsContent>
      <TabsContent value="angular">@spartan-ng/brain + 같은 스타일 레시피</TabsContent>
    </Tabs>
  );
}
```
