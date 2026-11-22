import {
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { autocompleteInputVariants } from "@goraebap/design-system/recipes/autocomplete";
import { buttonVariants } from "@goraebap/design-system/recipes/button";
import { comboboxInputVariants } from "@goraebap/design-system/recipes/combobox";
import {
  contextMenuItemVariants,
  contextMenuPopupVariants,
  contextMenuSeparatorVariants,
} from "@goraebap/design-system/recipes/context-menu";
import {
  menuItemVariants,
  menuPopupVariants,
  menuSeparatorVariants,
} from "@goraebap/design-system/recipes/menu";
import { menubarTriggerVariants, menubarVariants } from "@goraebap/design-system/recipes/menubar";
import {
  navigationMenuLinkVariants,
  navigationMenuListVariants,
  navigationMenuPopupVariants,
  navigationMenuTriggerVariants,
} from "@goraebap/design-system/recipes/navigation-menu";
import {
  otpFieldInputVariants,
  otpFieldRootVariants,
  otpFieldSeparatorVariants,
} from "@goraebap/design-system/recipes/otp-field";
import { popoverPopupVariants } from "@goraebap/design-system/recipes/popover";
import { selectTriggerVariants } from "@goraebap/design-system/recipes/select";
import { sliderNativeVariants } from "@goraebap/design-system/recipes/slider";
import {
  toastCloseVariants,
  toastRootVariants,
  toastViewportVariants,
} from "@goraebap/design-system/recipes/toast";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { handleMenuKeys, useNativePopup } from "../lib/native-popup";

const POPUP_BASE = "goraebap-native-popup m-0";
const HIDE_DATALIST_ARROW = "[&::-webkit-calendar-picker-indicator]:hidden!";
const FRAMEWORK_ITEMS = ["React", "Angular", "Pure HTML", "Tailwind CSS", "Base UI"];
const SELECT_ITEMS = [
  { value: "app", label: "App Theme" },
  { value: "editorial", label: "Editorial Theme" },
  { value: "system", label: "시스템 기본값" },
];
const MENUBAR_MENUS = [
  { label: "파일", items: ["새 문서", "저장"] },
  { label: "편집", items: ["실행 취소", "복사"] },
  { label: "보기", items: ["확대", "축소"] },
];
const OTP_LENGTH = 6;
const TOAST_LIMIT = 3;
const TOAST_DURATION = 5000;

export function NativePopoverDemo() {
  const { popupId, triggerRef, popupRef } = useNativePopup({ sideOffset: 8 });
  return (
    <div className="flex items-center justify-center py-6">
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={popupId}
        aria-expanded="false"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        필터 옵션
      </button>
      <div
        ref={popupRef}
        id={popupId}
        popover="auto"
        role="dialog"
        aria-label="표시 범위"
        className={`${POPUP_BASE} ${popoverPopupVariants()}`}
      >
        <h4 className="text-sm font-semibold tracking-tight">표시 범위</h4>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          트리거 근처에 짧은 보조 정보나 필터 옵션을 띄웁니다.
        </p>
      </div>
    </div>
  );
}

export function NativeSelectDemo() {
  const [value, setValue] = useState("app");
  return (
    <div className="mx-auto max-w-xs py-4">
      <div className="relative">
        <select
          aria-label="테마 선택"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`appearance-none pr-8 ${selectTriggerVariants()}`}
        >
          {SELECT_ITEMS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <SystemIcon
          name="chevronDown"
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2"
        />
      </div>
    </div>
  );
}

export function NativeMenuDemo() {
  const { popupId, triggerRef, popupRef, close } = useNativePopup({
    align: "start",
    focusFirstItem: true,
  });
  return (
    <div className="flex items-center justify-center py-6">
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={popupId}
        aria-haspopup="menu"
        aria-expanded="false"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        작업 메뉴
      </button>
      <div
        ref={popupRef}
        id={popupId}
        popover="auto"
        role="menu"
        onKeyDown={handleMenuKeys}
        className={`${POPUP_BASE} ${menuPopupVariants()}`}
      >
        <button type="button" role="menuitem" onClick={close} className={menuItemVariants()}>
          복제
        </button>
        <button type="button" role="menuitem" onClick={close} className={menuItemVariants()}>
          이름 바꾸기
        </button>
        <div role="separator" className={menuSeparatorVariants()} />
        <button
          type="button"
          role="menuitem"
          onClick={close}
          className={menuItemVariants({ variant: "destructive" })}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export function NativeSliderDemo() {
  const [val, setVal] = useState(60);
  return (
    <div className="mx-auto max-w-sm space-y-2 py-4">
      <div className="flex justify-between text-xs">
        <span className="font-medium">불투명도</span>
        <span className="text-muted-foreground font-mono">{val}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        aria-label="불투명도"
        style={{ "--slider-value": `${val}%` } as CSSProperties}
        className={sliderNativeVariants()}
      />
    </div>
  );
}

export function NativeToastDemo() {
  const [toasts, setToasts] = useState<number[]>([]);
  const nextId = useRef(0);

  function remove(id: number) {
    setToasts((current) => current.filter((item) => item !== id));
  }

  function add() {
    const id = nextId.current++;
    setToasts((current) => [...current, id].slice(-TOAST_LIMIT));
    setTimeout(() => remove(id), TOAST_DURATION);
  }

  return (
    <div className="flex items-center justify-center py-4">
      <button
        type="button"
        className={buttonVariants({ variant: "outline", size: "sm" })}
        onClick={add}
      >
        알림 띄우기
      </button>
      {toasts.length > 0 && (
        <div className={toastViewportVariants()}>
          {toasts.map((id) => (
            <div key={id} role="status" className={toastRootVariants()}>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">설정이 저장되었습니다</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  변경 사항이 즉시 반영됩니다.
                </p>
              </div>
              <button
                type="button"
                aria-label="닫기"
                className={toastCloseVariants()}
                onClick={() => remove(id)}
              >
                <SystemIcon name="close" className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NativeComboboxDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mx-auto max-w-xs py-4">
      <div className="relative">
        <input
          ref={inputRef}
          list="native-combobox-list"
          placeholder="프레임워크 검색..."
          aria-label="프레임워크 선택"
          className={`${HIDE_DATALIST_ARROW} ${comboboxInputVariants()}`}
        />
        <button
          type="button"
          aria-label="목록 열기"
          onClick={() => {
            inputRef.current?.focus();
            inputRef.current?.showPicker();
          }}
          className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
        >
          <SystemIcon name="chevronDown" className="size-3.5" />
        </button>
      </div>
      <datalist id="native-combobox-list">
        {FRAMEWORK_ITEMS.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
}

export function NativeAutocompleteDemo() {
  return (
    <div className="mx-auto max-w-xs py-4">
      <input
        list="native-autocomplete-list"
        placeholder="컴포넌트 검색..."
        aria-label="자동완성 입력"
        className={`${HIDE_DATALIST_ARROW} ${autocompleteInputVariants()}`}
      />
      <datalist id="native-autocomplete-list">
        {FRAMEWORK_ITEMS.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
}

export function NativeOTPFieldDemo() {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function focusAt(index: number) {
    inputs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
  }

  function handleInput(index: number, event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    input.value = input.value.replace(/\D/g, "").slice(-1);
    if (input.value) focusAt(index + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !event.currentTarget.value && index > 0) {
      event.preventDefault();
      const previous = inputs.current[index - 1];
      if (previous) previous.value = "";
      focusAt(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH - index);
    [...digits].forEach((digit, offset) => {
      const input = inputs.current[index + offset];
      if (input) input.value = digit;
    });
    focusAt(index + digits.length);
  }

  const field = (index: number) => (
    <input
      key={index}
      ref={(element) => {
        inputs.current[index] = element;
      }}
      type="text"
      inputMode="numeric"
      autoComplete={index === 0 ? "one-time-code" : "off"}
      maxLength={1}
      aria-label={`인증번호 ${index + 1}번째 자리`}
      onFocus={(e) => e.currentTarget.select()}
      onInput={(e) => handleInput(index, e)}
      onKeyDown={(e) => handleKeyDown(index, e)}
      onPaste={(e) => handlePaste(index, e)}
      className={otpFieldInputVariants()}
    />
  );

  return (
    <div className="flex items-center justify-center py-4">
      <div role="group" aria-label="인증번호 6자리" className={otpFieldRootVariants()}>
        {[0, 1, 2].map(field)}
        <span aria-hidden="true" className={otpFieldSeparatorVariants()}>
          -
        </span>
        {[3, 4, 5].map(field)}
      </div>
    </div>
  );
}

export function NativeContextMenuDemo() {
  const { popupId, triggerRef, popupRef, openAt, close } = useNativePopup<HTMLDivElement>({
    align: "start",
    sideOffset: 0,
    focusFirstItem: true,
  });
  return (
    <div className="flex items-center justify-center py-4">
      <div
        ref={triggerRef}
        onContextMenu={(e) => {
          e.preventDefault();
          openAt(e.clientX, e.clientY);
        }}
        className="border-border bg-card text-muted-foreground flex h-24 w-64 items-center justify-center rounded-xl border border-dashed text-xs"
      >
        이 영역에서 우클릭하세요
      </div>
      <div
        ref={popupRef}
        id={popupId}
        popover="auto"
        role="menu"
        onKeyDown={handleMenuKeys}
        className={`${POPUP_BASE} ${contextMenuPopupVariants()}`}
      >
        <button type="button" role="menuitem" onClick={close} className={contextMenuItemVariants()}>
          복사
        </button>
        <button type="button" role="menuitem" onClick={close} className={contextMenuItemVariants()}>
          이름 바꾸기
        </button>
        <div role="separator" className={contextMenuSeparatorVariants()} />
        <button
          type="button"
          role="menuitem"
          onClick={close}
          className={contextMenuItemVariants({ variant: "destructive" })}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function NativeMenubarMenu({ label, items }: { label: string; items: string[] }) {
  const { popupId, triggerRef, popupRef, open, close } = useNativePopup({
    align: "start",
    focusFirstItem: true,
  });

  function handlePointerEnter(event: PointerEvent<HTMLButtonElement>) {
    const openPopup = event.currentTarget
      .closest('[role="menubar"]')
      ?.querySelector(":popover-open");
    if (openPopup && openPopup !== popupRef.current) open();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="menuitem"
        popoverTarget={popupId}
        aria-haspopup="menu"
        aria-expanded="false"
        onPointerEnter={handlePointerEnter}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            open();
          }
        }}
        className={menubarTriggerVariants()}
      >
        {label}
      </button>
      <div
        ref={popupRef}
        id={popupId}
        popover="auto"
        role="menu"
        aria-label={label}
        onKeyDown={handleMenuKeys}
        className={`${POPUP_BASE} ${menuPopupVariants()}`}
      >
        {items.map((item) => (
          <button
            key={item}
            type="button"
            role="menuitem"
            onClick={close}
            className={menuItemVariants()}
          >
            {item}
          </button>
        ))}
      </div>
    </>
  );
}

function handleMenubarKeys(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const triggers = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[aria-haspopup="menu"]'),
  ];
  const openPopup = event.currentTarget.querySelector<HTMLElement>(":popover-open");
  const current = openPopup
    ? triggers.findIndex((item) => item.getAttribute("popovertarget") === openPopup.id)
    : triggers.indexOf(document.activeElement as HTMLButtonElement);
  if (current < 0) return;
  event.preventDefault();
  const step = event.key === "ArrowRight" ? 1 : -1;
  const next = triggers[(current + step + triggers.length) % triggers.length];
  next.focus();
  if (openPopup) {
    document.getElementById(next.getAttribute("popovertarget") ?? "")?.showPopover();
  }
}

export function NativeMenubarDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <div role="menubar" onKeyDown={handleMenubarKeys} className={menubarVariants()}>
        {MENUBAR_MENUS.map((menu) => (
          <NativeMenubarMenu key={menu.label} label={menu.label} items={menu.items} />
        ))}
      </div>
    </div>
  );
}

export function NativeNavigationMenuDemo() {
  const { popupId, triggerRef, popupRef, open, close } = useNativePopup({ sideOffset: 8 });
  const closeTimer = useRef<number | undefined>(undefined);

  function openNow() {
    window.clearTimeout(closeTimer.current);
    open();
  }

  function closeSoon() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(close, 150);
  }

  return (
    <div className="flex items-center justify-center py-4">
      <nav aria-label="예제 메뉴" className={navigationMenuListVariants()}>
        <button
          ref={triggerRef}
          type="button"
          aria-expanded="false"
          aria-controls={popupId}
          onPointerEnter={openNow}
          onPointerLeave={closeSoon}
          onClick={openNow}
          className={`group ${navigationMenuTriggerVariants()}`}
        >
          <span>파운데이션</span>
          <SystemIcon
            name="chevronDown"
            className="size-3 transition-transform duration-150 group-data-[popup-open]:rotate-180"
          />
        </button>
        <a
          href="#nav-components"
          onClick={(e) => e.preventDefault()}
          className={navigationMenuTriggerVariants()}
        >
          컴포넌트
        </a>
        <a
          href="#nav-themes"
          onClick={(e) => e.preventDefault()}
          className={navigationMenuTriggerVariants()}
        >
          테마
        </a>
        <div
          ref={popupRef}
          id={popupId}
          popover="auto"
          onPointerEnter={openNow}
          onPointerLeave={closeSoon}
          className={`${POPUP_BASE} space-y-1 ${navigationMenuPopupVariants()}`}
        >
          <a
            href="#nav-tokens"
            onClick={(e) => e.preventDefault()}
            className={navigationMenuLinkVariants()}
          >
            <p className="font-medium">디자인 토큰</p>
            <p className="text-muted-foreground">색상, 반경, 타이포그래피 변수</p>
          </a>
          <a
            href="#nav-recipes"
            onClick={(e) => e.preventDefault()}
            className={navigationMenuLinkVariants()}
          >
            <p className="font-medium">스타일 레시피</p>
            <p className="text-muted-foreground">CVA 기반 공통 스타일 규칙</p>
          </a>
        </div>
      </nav>
    </div>
  );
}
