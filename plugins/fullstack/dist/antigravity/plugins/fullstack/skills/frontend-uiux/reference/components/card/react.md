# Card (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@goraebap/ui-react/components/card";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>에이전트 토큰</CardTitle>
        <CardDescription>MCP 서버 접근을 위한 개인 토큰입니다.</CardDescription>
      </CardHeader>
      <CardContent>활성 토큰 2개</CardContent>
      <CardFooter>
        <Button size="sm">새 토큰 발급</Button>
      </CardFooter>
    </Card>
  );
}
```
