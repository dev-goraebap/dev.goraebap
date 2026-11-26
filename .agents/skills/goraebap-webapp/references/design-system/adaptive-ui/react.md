# 적응형 UI (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## is-mobile

`@goraebap/ui-react/lib/use-is-mobile`의 `useIsMobile`이 64rem 기준으로 휴대폰 폭을 판별합니다. 대화상자와 팝오버는 `responsive-overlay`의 자동 전환 래퍼를 쓰고, 나머지는 이 값으로 나눕니다.

```tsx
import { useIsMobile } from "@goraebap/ui-react/lib/use-is-mobile";

const isMobile = useIsMobile();
```

## dialog-to-sheet

`@goraebap/ui-react/components/responsive-overlay`의 `ResponsiveDialog`가 64rem 경계에 따라 `Dialog`와 `BottomSheet`를 자동으로 바꿉니다.

```tsx
<ResponsiveDialog>
  <ResponsiveDialogTrigger render={<Button />}>필터 설정</ResponsiveDialogTrigger>
  <ResponsiveDialogContent>
    <ResponsiveDialogTitle>필터 설정</ResponsiveDialogTitle>
    <ResponsiveDialogDescription>조건을 고릅니다.</ResponsiveDialogDescription>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

## popover-to-sheet

`ResponsivePopover`는 64rem 미만에서 `BottomSheet`로 바뀌고, `mobile="popover"`를 지정하면 휴대폰에서도 팝오버를 유지합니다.

```tsx
<ResponsivePopover>
  <ResponsivePopoverTrigger render={<Button variant="outline" />}>표시 옵션</ResponsivePopoverTrigger>
  <ResponsivePopoverContent>
    <ResponsivePopoverTitle>표시 옵션</ResponsivePopoverTitle>
  </ResponsivePopoverContent>
</ResponsivePopover>

{/* 휴대폰에서도 팝오버 유지 */}
<ResponsivePopover mobile="popover">...</ResponsivePopover>
```

## list-to-sheet

`Select`, `Menu`, `Combobox`, `Context Menu`에는 자동 전환 래퍼가 없으므로 `useIsMobile`로 나눠 `BottomSheet`를 직접 씁니다. 시트 항목은 `h-11`(44px)로 둡니다.

```tsx
const isMobile = useIsMobile();

if (isMobile) {
  return (
    <BottomSheet>
      <BottomSheetTrigger render={<Button variant="outline" />}>더보기</BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetTitle>항목 작업</BottomSheetTitle>
        <BottomSheetClose render={<Button variant="ghost" className="h-11 w-full justify-start" />}>
          복제
        </BottomSheetClose>
      </BottomSheetContent>
    </BottomSheet>
  );
}

return (
  <Menu>
    <MenuTrigger render={<Button variant="outline" />}>더보기</MenuTrigger>
    <MenuContent>
      <MenuItem>복제</MenuItem>
    </MenuContent>
  </Menu>
);
```

## mobile-action

휴대폰의 짧은 실행 버튼은 최소 너비 88px를 주고, 전체 폭(`w-full`)은 바텀시트와 양식 끝처럼 버튼이 세로로 쌓이는 곳에만 씁니다.

```tsx
<Button size={isMobile ? "lg" : "default"} className={isMobile ? "min-w-[88px]" : undefined}>
  저장
</Button>
```

## safe-area

`BottomSheet`는 최대 높이·내부 스크롤·아래쪽 안전 영역을 기본으로 적용하고, 직접 만든 아래 고정 막대에만 `dvh`와 `safe-area-inset-bottom`을 지정합니다. 이 막대는 양식 끝이라 전체 폭 버튼을 씁니다.

```tsx
{/* BottomSheet는 최대 높이 85dvh · 내부 스크롤 · 하단 safe area 기본 적용 */}
<BottomSheetContent>
  <BottomSheetTitle>옵션 선택</BottomSheetTitle>
  {/* 긴 목록도 시트 내부에서 스크롤됨 */}
</BottomSheetContent>

{/* 커스텀 하단 고정 바에는 dvh와 safe-area-inset-bottom을 직접 적용 */}
<div className="bg-background fixed inset-x-0 bottom-0 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
  <Button size="lg" className="w-full">저장</Button>
</div>
```

## state-on-switch

열림 상태와 입력값을 `ResponsiveDialog` 바깥의 상태에 두고 제어 속성으로 넘깁니다.

```tsx
const [open, setOpen] = useState(false);
const [keyword, setKeyword] = useState("");

return (
  <ResponsiveDialog open={open} onOpenChange={setOpen}>
    <ResponsiveDialogTrigger render={<Button />}>필터 설정</ResponsiveDialogTrigger>
    <ResponsiveDialogContent>
      <ResponsiveDialogTitle>필터 설정</ResponsiveDialogTitle>
      <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
    </ResponsiveDialogContent>
  </ResponsiveDialog>
);
```
