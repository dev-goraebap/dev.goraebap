import { useState } from "react";
import { autocompleteInputVariants } from "@goraebap/design-system/recipes/autocomplete";
import { comboboxInputVariants } from "@goraebap/design-system/recipes/combobox";
import {
  contextMenuItemVariants,
  contextMenuPopupVariants,
  contextMenuSeparatorVariants,
} from "@goraebap/design-system/recipes/context-menu";
import { menubarTriggerVariants, menubarVariants } from "@goraebap/design-system/recipes/menubar";
import {
  navigationMenuListVariants,
  navigationMenuTriggerVariants,
} from "@goraebap/design-system/recipes/navigation-menu";
import {
  otpFieldInputVariants,
  otpFieldRootVariants,
  otpFieldSeparatorVariants,
} from "@goraebap/design-system/recipes/otp-field";
import { previewCardPopupVariants } from "@goraebap/design-system/recipes/preview-card";
import {
  scrollAreaRootVariants,
  scrollAreaViewportVariants,
} from "@goraebap/design-system/recipes/scroll-area";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@goraebap/ui-react/components/autocomplete";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@goraebap/ui-react/components/combobox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@goraebap/ui-react/components/context-menu";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@goraebap/ui-react/components/menu";
import { Menubar } from "@goraebap/ui-react/components/menubar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@goraebap/ui-react/components/navigation-menu";
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@goraebap/ui-react/components/otp-field";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@goraebap/ui-react/components/preview-card";
import { ScrollArea } from "@goraebap/ui-react/components/scroll-area";

const FRAMEWORK_ITEMS = ["React", "Angular", "Pure HTML", "Tailwind CSS", "Base UI"];

/* ── Combobox ─────────────────────────────────────────────────── */

export function NativeComboboxDemo() {
  return (
    <div className="mx-auto max-w-xs py-4">
      <input
        list="native-combobox-list"
        placeholder="프레임워크 검색..."
        aria-label="프레임워크 선택"
        className={comboboxInputVariants()}
      />
      <datalist id="native-combobox-list">
        {FRAMEWORK_ITEMS.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
}

export function ReactComboboxDemo() {
  return (
    <div className="mx-auto max-w-xs py-4">
      <Combobox items={FRAMEWORK_ITEMS}>
        <ComboboxInput placeholder="프레임워크 검색..." aria-label="프레임워크 선택" />
        <ComboboxContent>
          <ComboboxEmpty className="text-muted-foreground px-2.5 py-2 text-xs">
            일치하는 항목이 없습니다.
          </ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

/* ── Autocomplete ─────────────────────────────────────────────── */

export function NativeAutocompleteDemo() {
  return (
    <div className="mx-auto max-w-xs py-4">
      <input
        list="native-autocomplete-list"
        placeholder="컴포넌트 검색..."
        aria-label="자동완성 입력"
        className={autocompleteInputVariants()}
      />
      <datalist id="native-autocomplete-list">
        {FRAMEWORK_ITEMS.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
}

export function ReactAutocompleteDemo() {
  return (
    <div className="mx-auto max-w-xs py-4">
      <Autocomplete items={FRAMEWORK_ITEMS}>
        <AutocompleteInput placeholder="컴포넌트 검색..." aria-label="자동완성 입력" />
        <AutocompleteContent>
          <AutocompleteEmpty className="text-muted-foreground px-2.5 py-2 text-xs">
            추천 항목이 없습니다.
          </AutocompleteEmpty>
          <AutocompleteList>
            {(item: string) => (
              <AutocompleteItem key={item} value={item}>
                {item}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
    </div>
  );
}

/* ── OTP Field ────────────────────────────────────────────────── */

export function NativeOTPFieldDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className={otpFieldRootVariants()}>
        {[0, 1, 2].map((i) => (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            maxLength={1}
            aria-label={`인증번호 ${i + 1}번째 자리`}
            className={otpFieldInputVariants()}
          />
        ))}
        <span className={otpFieldSeparatorVariants()}>-</span>
        {[3, 4, 5].map((i) => (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            maxLength={1}
            aria-label={`인증번호 ${i + 1}번째 자리`}
            className={otpFieldInputVariants()}
          />
        ))}
      </div>
    </div>
  );
}

export function ReactOTPFieldDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <OTPField length={6} aria-label="인증번호 6자리">
        <OTPFieldInput />
        <OTPFieldInput />
        <OTPFieldInput />
        <OTPFieldSeparator />
        <OTPFieldInput />
        <OTPFieldInput />
        <OTPFieldInput />
      </OTPField>
    </div>
  );
}

/* ── Context Menu ─────────────────────────────────────────────── */

export function NativeContextMenuDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-center py-4">
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="border-border bg-card text-muted-foreground flex h-24 w-64 items-center justify-center rounded-xl border border-dashed text-xs"
      >
        이 영역에서 우클릭하세요
      </div>
      {open && (
        <div role="menu" className={`absolute top-full mt-2 ${contextMenuPopupVariants()}`}>
          <button
            type="button"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={contextMenuItemVariants()}
          >
            복사
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={contextMenuItemVariants()}
          >
            이름 바꾸기
          </button>
          <div className={contextMenuSeparatorVariants()} />
          <button
            type="button"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={contextMenuItemVariants({ variant: "destructive" })}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

export function ReactContextMenuDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <ContextMenu>
        <ContextMenuTrigger className="border-border bg-card text-muted-foreground flex h-24 w-64 items-center justify-center rounded-xl border border-dashed text-xs">
          이 영역에서 우클릭하세요
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>복사</ContextMenuItem>
          <ContextMenuItem>이름 바꾸기</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">삭제</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

/* ── Preview Card ─────────────────────────────────────────────── */

export function NativePreviewCardDemo() {
  return (
    <div className="flex items-center justify-center py-6">
      <span className="group relative inline-flex">
        <a
          href="#preview-card-demo"
          onClick={(e) => e.preventDefault()}
          className="text-foreground text-sm font-medium underline underline-offset-4"
        >
          @goraebap/design-system
        </a>
        <div
          className={`pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 ${previewCardPopupVariants()}`}
        >
          <p className="text-sm font-semibold">@goraebap/design-system</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            프레임워크와 무관한 CSS 토큰과 CVA 레시피 패키지입니다.
          </p>
        </div>
      </span>
    </div>
  );
}

export function ReactPreviewCardDemo() {
  return (
    <div className="flex items-center justify-center py-6">
      <PreviewCard>
        <PreviewCardTrigger
          href="#preview-card-demo"
          onClick={(e) => e.preventDefault()}
          className="text-foreground text-sm font-medium underline underline-offset-4"
        >
          @goraebap/design-system
        </PreviewCardTrigger>
        <PreviewCardContent>
          <p className="text-sm font-semibold">@goraebap/design-system</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            프레임워크와 무관한 CSS 토큰과 CVA 레시피 패키지입니다.
          </p>
        </PreviewCardContent>
      </PreviewCard>
    </div>
  );
}

/* ── Menubar ──────────────────────────────────────────────────── */

export function NativeMenubarDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <div role="menubar" className={menubarVariants()}>
        <button type="button" role="menuitem" className={menubarTriggerVariants()}>
          파일
        </button>
        <button type="button" role="menuitem" className={menubarTriggerVariants()}>
          편집
        </button>
        <button type="button" role="menuitem" className={menubarTriggerVariants()}>
          보기
        </button>
      </div>
    </div>
  );
}

export function ReactMenubarDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <Menubar>
        <Menu>
          <MenuTrigger className={menubarTriggerVariants()}>파일</MenuTrigger>
          <MenuContent>
            <MenuItem>새 문서</MenuItem>
            <MenuItem>저장</MenuItem>
          </MenuContent>
        </Menu>
        <Menu>
          <MenuTrigger className={menubarTriggerVariants()}>편집</MenuTrigger>
          <MenuContent>
            <MenuItem>실행 취소</MenuItem>
            <MenuItem>복사</MenuItem>
          </MenuContent>
        </Menu>
        <Menu>
          <MenuTrigger className={menubarTriggerVariants()}>보기</MenuTrigger>
          <MenuContent>
            <MenuItem>확대</MenuItem>
            <MenuItem>축소</MenuItem>
          </MenuContent>
        </Menu>
      </Menubar>
    </div>
  );
}

/* ── Navigation Menu ──────────────────────────────────────────── */

export function NativeNavigationMenuDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <nav aria-label="예제 메뉴" className={navigationMenuListVariants()}>
        <a href="#nav-demo" onClick={(e) => e.preventDefault()} className={navigationMenuTriggerVariants()}>
          파운데이션
        </a>
        <a href="#nav-demo" onClick={(e) => e.preventDefault()} className={navigationMenuTriggerVariants()}>
          컴포넌트
        </a>
        <a href="#nav-demo" onClick={(e) => e.preventDefault()} className={navigationMenuTriggerVariants()}>
          테마
        </a>
      </nav>
    </div>
  );
}

export function ReactNavigationMenuDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>파운데이션</NavigationMenuTrigger>
            <NavigationMenuContent className="space-y-1">
              <NavigationMenuLink href="#nav-tokens" onClick={(e) => e.preventDefault()}>
                <p className="font-medium">디자인 토큰</p>
                <p className="text-muted-foreground">색상, 반경, 타이포그래피 변수</p>
              </NavigationMenuLink>
              <NavigationMenuLink href="#nav-recipes" onClick={(e) => e.preventDefault()}>
                <p className="font-medium">스타일 레시피</p>
                <p className="text-muted-foreground">CVA 기반 공통 스타일 규칙</p>
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#nav-components"
              onClick={(e) => e.preventDefault()}
              className={navigationMenuTriggerVariants()}
            >
              컴포넌트
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport />
      </NavigationMenu>
    </div>
  );
}

/* ── Scroll Area ──────────────────────────────────────────────── */

const SCROLL_ITEMS = Array.from({ length: 12 }, (_, i) => `토큰 프리셋 항목 ${i + 1}`);

export function NativeScrollAreaDemo() {
  return (
    <div className={`mx-auto h-40 max-w-xs ${scrollAreaRootVariants()}`}>
      <div className={`p-3 ${scrollAreaViewportVariants()}`}>
        <div className="divide-border divide-y text-xs">
          {SCROLL_ITEMS.map((item) => (
            <div key={item} className="py-2">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReactScrollAreaDemo() {
  return (
    <ScrollArea className="mx-auto h-40 max-w-xs">
      <div className="divide-border divide-y p-3 text-xs">
        {SCROLL_ITEMS.map((item) => (
          <div key={item} className="py-2">
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
