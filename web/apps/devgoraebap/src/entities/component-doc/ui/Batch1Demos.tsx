import { useState } from "react";
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
