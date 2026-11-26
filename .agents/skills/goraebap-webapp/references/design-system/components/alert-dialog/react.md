# Alert Dialog (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@goraebap/ui-react/components/alert-dialog";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>프로젝트 삭제</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>프로젝트를 삭제할까요?</AlertDialogTitle>
        <AlertDialogDescription>삭제한 프로젝트는 복구할 수 없습니다.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" size="sm" />}>취소</AlertDialogClose>
          <AlertDialogClose render={<Button variant="destructive" size="sm" />}>삭제</AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```
