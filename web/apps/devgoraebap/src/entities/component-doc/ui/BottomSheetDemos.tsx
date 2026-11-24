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
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
  ResponsivePopover,
  ResponsivePopoverContent,
  ResponsivePopoverDescription,
  ResponsivePopoverTitle,
  ResponsivePopoverTrigger,
} from "@goraebap/ui-react/components/responsive-overlay";

export function ReactBottomSheetDemo() {
  return (
    <div className="flex items-center justify-center py-4">
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
    </div>
  );
}

export function ReactResponsivePopoverDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <ResponsivePopover>
        <ResponsivePopoverTrigger render={<Button variant="outline" />}>
          표시 옵션
        </ResponsivePopoverTrigger>
        <ResponsivePopoverContent>
          <ResponsivePopoverTitle>표시 옵션</ResponsivePopoverTitle>
          <ResponsivePopoverDescription>
            넓은 화면에서는 팝오버, 좁은 화면에서는 바텀시트로 열립니다.
          </ResponsivePopoverDescription>
        </ResponsivePopoverContent>
      </ResponsivePopover>
    </div>
  );
}

export function ReactResponsiveDialogDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <ResponsiveDialog>
        <ResponsiveDialogTrigger render={<Button variant="outline" />}>
          필터 설정
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent>
          <ResponsiveDialogTitle>필터 설정</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            넓은 화면에서는 중앙 모달, 좁은 화면에서는 바텀시트로 열립니다.
          </ResponsiveDialogDescription>
          <div className="mt-5 flex justify-end">
            <ResponsiveDialogClose render={<Button />}>적용</ResponsiveDialogClose>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
