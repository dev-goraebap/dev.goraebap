# Table (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@goraebap/ui-react/components/table";

export function Example() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>서비스</TableHead>
          <TableHead>어댑터</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>apps/blog</TableCell>
          <TableCell>React + Angular</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```
