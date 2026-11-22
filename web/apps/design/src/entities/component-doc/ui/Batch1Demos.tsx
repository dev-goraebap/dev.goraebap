import { useRef, useState } from "react";
import { alertDialogPopupVariants } from "@goraebap/design-system/recipes/alert-dialog";
import { buttonVariants } from "@goraebap/design-system/recipes/button";
import { toggleVariants } from "@goraebap/design-system/recipes/toggle";
import { toggleGroupVariants } from "@goraebap/design-system/recipes/toggle-group";
import { tooltipPopupVariants } from "@goraebap/design-system/recipes/tooltip";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@goraebap/ui-react/components/alert-dialog";
import { Button } from "@goraebap/ui-react/components/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@goraebap/ui-react/components/menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@goraebap/ui-react/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@goraebap/ui-react/components/select";
import { Toggle } from "@goraebap/ui-react/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@goraebap/ui-react/components/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@goraebap/ui-react/components/tooltip";
import { SystemIcon } from "@goraebap/ui-react/icons";

/* ── Toggle ───────────────────────────────────────────────────── */

export function NativeToggleDemo() {
  const [pressed, setPressed] = useState(true);
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        type="button"
        aria-pressed={pressed}
        data-pressed={pressed ? "" : undefined}
        onClick={() => setPressed((p) => !p)}
        className={toggleVariants({ variant: "outline" })}
      >
        <SystemIcon name="sun" className="size-3.5" />
        <span>{pressed ? "고정됨" : "고정"}</span>
      </button>
    </div>
  );
}

export function ReactToggleDemo() {
  const [pressed, setPressed] = useState(true);
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Toggle variant="outline" pressed={pressed} onPressedChange={setPressed}>
        <SystemIcon name="sun" className="size-3.5" />
        <span>{pressed ? "고정됨" : "고정"}</span>
      </Toggle>
    </div>
  );
}

/* ── Toggle Group ─────────────────────────────────────────────── */

export function NativeToggleGroupDemo() {
  const [value, setValue] = useState<"app" | "editorial">("app");
  return (
    <div className="flex items-center justify-center py-4">
      <div role="group" aria-label="테마 선택" className={toggleGroupVariants({ shape: "pill" })}>
        {(
          [
            { id: "app", label: "App" },
            { id: "editorial", label: "Editorial" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={value === item.id}
            data-pressed={value === item.id ? "" : undefined}
            onClick={() => setValue(item.id)}
            className={toggleVariants({ shape: "pill" })}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReactToggleGroupDemo() {
  const [value, setValue] = useState<string[]>(["app"]);
  return (
    <div className="flex items-center justify-center py-4">
      <ToggleGroup
        shape="pill"
        value={value}
        onValueChange={(next) => {
          if (next.length > 0) setValue(next);
        }}
        aria-label="테마 선택"
      >
        <ToggleGroupItem value="app" shape="pill">
          App
        </ToggleGroupItem>
        <ToggleGroupItem value="editorial" shape="pill">
          Editorial
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

/* ── Tooltip ──────────────────────────────────────────────────── */

export function NativeTooltipDemo() {
  return (
    <div className="flex items-center justify-center py-6">
      <span className="group relative inline-flex">
        <button type="button" className={buttonVariants({ variant: "outline", size: "sm" })}>
          마우스를 올려 보세요
        </button>
        <span
          role="tooltip"
          className={`pointer-events-none invisible absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${tooltipPopupVariants()}`}
        >
          단축키: Ctrl + K
        </span>
      </span>
    </div>
  );
}

export function ReactTooltipDemo() {
  return (
    <TooltipProvider delay={150}>
      <div className="flex items-center justify-center py-6">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="sm" />}>
            마우스를 올려 보세요
          </TooltipTrigger>
          <TooltipContent>단축키: Ctrl + K</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/* ── Popover ──────────────────────────────────────────────────── */

export function ReactPopoverDemo() {
  return (
    <div className="flex items-center justify-center py-6">
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="sm" />}>필터 옵션</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>표시 범위</PopoverTitle>
          <PopoverDescription>
            트리거 근처에 짧은 보조 정보나 필터 옵션을 띄웁니다.
          </PopoverDescription>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ── Select ───────────────────────────────────────────────────── */

const SELECT_ITEMS = [
  { value: "app", label: "App Theme" },
  { value: "editorial", label: "Editorial Theme" },
  { value: "system", label: "시스템 기본값" },
];

export function ReactSelectDemo() {
  const [value, setValue] = useState<string | null>("app");
  const currentLabel = SELECT_ITEMS.find((i) => i.value === value)?.label ?? "선택하세요";
  return (
    <div className="mx-auto max-w-xs py-4">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="테마 선택">
          <SelectValue>{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SELECT_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ── Menu ─────────────────────────────────────────────────────── */

export function ReactMenuDemo() {
  return (
    <div className="flex items-center justify-center py-6">
      <Menu>
        <MenuTrigger render={<Button variant="outline" size="sm" />}>작업 메뉴</MenuTrigger>
        <MenuContent>
          <MenuItem>복제</MenuItem>
          <MenuItem>이름 바꾸기</MenuItem>
          <MenuSeparator />
          <MenuItem variant="destructive">삭제</MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

/* ── Alert Dialog ─────────────────────────────────────────────── */

export function NativeAlertDialogDemo() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <div className="flex items-center justify-center py-4">
      <button
        type="button"
        className={buttonVariants({ variant: "destructive", size: "sm" })}
        onClick={() => dialogRef.current?.showModal()}
      >
        프로젝트 삭제
      </button>
      <dialog
        ref={dialogRef}
        data-surface="dialog"
        className={`goraebap-native-dialog m-0 max-h-none ${alertDialogPopupVariants()}`}
      >
        <h3 className="text-base font-semibold tracking-tight">프로젝트를 삭제할까요?</h3>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
          삭제한 프로젝트와 연결된 토큰은 복구할 수 없습니다.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            onClick={() => dialogRef.current?.close()}
          >
            취소
          </button>
          <button
            type="button"
            className={buttonVariants({ variant: "destructive", size: "sm" })}
            onClick={() => dialogRef.current?.close()}
          >
            삭제
          </button>
        </div>
      </dialog>
    </div>
  );
}

export function ReactAlertDialogDemo() {
  return (
    <div className="flex items-center justify-center py-4">
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
          프로젝트 삭제
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>프로젝트를 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제한 프로젝트와 연결된 토큰은 복구할 수 없습니다.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" size="sm" />}>취소</AlertDialogClose>
            <AlertDialogClose render={<Button variant="destructive" size="sm" />}>
              삭제
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
