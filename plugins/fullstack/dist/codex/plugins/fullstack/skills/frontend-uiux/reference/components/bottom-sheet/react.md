# Bottom Sheet (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@goraebap/ui-react/components/bottom-sheet";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <BottomSheet>
      <BottomSheetTrigger render={<Button />}>바텀시트 열기</BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetTitle>필터 설정</BottomSheetTitle>
        <BottomSheetDescription>아래로 끌어내리거나 바깥을 눌러 닫습니다.</BottomSheetDescription>
        <BottomSheetFooter>
          <BottomSheetClose render={<Button variant="ghost" />}>취소</BottomSheetClose>
          <BottomSheetClose render={<Button />}>적용</BottomSheetClose>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}
```
