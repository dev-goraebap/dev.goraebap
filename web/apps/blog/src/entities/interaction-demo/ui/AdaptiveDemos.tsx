import { Link } from "@tanstack/react-router";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@goraebap/ui-react/components/bottom-sheet";
import { Button } from "@goraebap/ui-react/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@goraebap/ui-react/components/dialog";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@goraebap/ui-react/components/menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@goraebap/ui-react/components/popover";
import { AdaptiveWireframe } from "@/shared/ui";

const MATRIX = [
  {
    slug: "dialog",
    name: "Dialog",
    desktop: "중앙 모달",
    mobile: "바텀시트",
    how: "ResponsiveDialog",
  },
  {
    slug: "popover",
    name: "Popover",
    desktop: "트리거 옆",
    mobile: "바텀시트",
    how: "ResponsivePopover",
  },
  {
    slug: "select",
    name: "Select",
    desktop: "드롭다운",
    mobile: "바텀시트 목록",
    how: "useIsMobile 분기",
  },
  {
    slug: "menu",
    name: "Menu",
    desktop: "드롭다운",
    mobile: "바텀시트 목록",
    how: "useIsMobile 분기",
  },
  {
    slug: "combobox",
    name: "Combobox",
    desktop: "드롭다운",
    mobile: "바텀시트 검색",
    how: "useIsMobile 분기",
  },
  {
    slug: "context-menu",
    name: "Context Menu",
    desktop: "우클릭 메뉴",
    mobile: "더보기 + 바텀시트",
    how: "useIsMobile 분기",
  },
  {
    slug: "alert-dialog",
    name: "Alert Dialog",
    desktop: "중앙 모달",
    mobile: "바텀시트(동작 위·취소 아래)",
    how: "useIsMobile 분기",
  },
];

export function AdaptiveMatrix() {
  return (
    <div className="border-border bg-card overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[34rem] text-left text-xs">
        <thead className="text-muted-foreground border-border border-b">
          <tr>
            <th className="px-4 py-2.5 font-medium">컴포넌트</th>
            <th className="px-4 py-2.5 font-medium">데스크톱</th>
            <th className="px-4 py-2.5 font-medium">모바일</th>
            <th className="px-4 py-2.5 font-medium">구현</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {MATRIX.map((row) => (
            <tr key={row.slug}>
              <td className="px-4 py-2.5 font-medium">
                <Link
                  to="/webapp/design-system/components/$slug"
                  params={{ slug: row.slug }}
                  className="underline-offset-2 hover:underline"
                >
                  {row.name}
                </Link>
              </td>
              <td className="text-muted-foreground px-4 py-2.5">{row.desktop}</td>
              <td className="text-foreground px-4 py-2.5">{row.mobile}</td>
              <td className="text-muted-foreground px-4 py-2.5 font-mono text-[0.6875rem]">
                {row.how}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileSheet({ label, title, list }: { label: string; title: string; list?: boolean }) {
  return (
    <BottomSheet>
      <BottomSheetTrigger render={<Button size="sm" />}>{label}</BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetTitle>{title}</BottomSheetTitle>
        {list ? (
          <div className="mt-3 space-y-1">
            {["이름 바꾸기", "복제", "보관"].map((item) => (
              <BottomSheetClose
                key={item}
                render={<Button variant="ghost" className="h-11 w-full justify-start" />}
              >
                {item}
              </BottomSheetClose>
            ))}
          </div>
        ) : (
          <>
            <BottomSheetDescription>
              아래로 끌어내리거나 바깥을 눌러 닫습니다.
            </BottomSheetDescription>
            <BottomSheetClose render={<Button className="mt-5 h-11 w-full" />}>
              적용
            </BottomSheetClose>
          </>
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}

export function AdaptivePatternDemo({ pattern }: { pattern: "dialog" | "popover" | "menu" }) {
  return (
    <div className="space-y-5">
      <AdaptiveWireframe pattern={pattern} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {pattern === "dialog" && (
          <Dialog>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              데스크톱 모양
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>필터 설정</DialogTitle>
              <DialogDescription>넓은 화면에서는 중앙 모달로 엽니다.</DialogDescription>
              <div className="mt-5 flex justify-end">
                <DialogClose render={<Button size="sm" />}>적용</DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {pattern === "popover" && (
          <Popover>
            <PopoverTrigger render={<Button size="sm" variant="outline" />}>
              데스크톱 모양
            </PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>표시 옵션</PopoverTitle>
              <PopoverDescription>넓은 화면에서는 트리거 옆에 엽니다.</PopoverDescription>
            </PopoverContent>
          </Popover>
        )}
        {pattern === "menu" && (
          <Menu>
            <MenuTrigger render={<Button size="sm" variant="outline" />}>데스크톱 모양</MenuTrigger>
            <MenuContent>
              <MenuItem>이름 바꾸기</MenuItem>
              <MenuItem>복제</MenuItem>
              <MenuItem>보관</MenuItem>
            </MenuContent>
          </Menu>
        )}
        <MobileSheet
          label="모바일 모양"
          title={
            pattern === "menu" ? "항목 작업" : pattern === "popover" ? "표시 옵션" : "필터 설정"
          }
          list={pattern === "menu"}
        />
      </div>
    </div>
  );
}
