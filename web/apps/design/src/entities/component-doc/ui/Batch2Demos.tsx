import { useRef, useState } from "react";
import {
  accordionItemVariants,
  accordionPanelVariants,
  accordionTriggerVariants,
} from "@goraebap/design-system/recipes/accordion";
import { avatarFallbackVariants, avatarVariants } from "@goraebap/design-system/recipes/avatar";
import { buttonVariants } from "@goraebap/design-system/recipes/button";
import {
  collapsiblePanelVariants,
  collapsibleTriggerVariants,
} from "@goraebap/design-system/recipes/collapsible";
import { dialogCloseButtonVariants } from "@goraebap/design-system/recipes/dialog";
import { drawerPopupVariants } from "@goraebap/design-system/recipes/drawer";
import {
  progressIndicatorVariants,
  progressTrackVariants,
} from "@goraebap/design-system/recipes/progress";
import { radioGroupVariants, radioItemVariants } from "@goraebap/design-system/recipes/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@goraebap/ui-react/components/accordion";
import { Avatar, AvatarFallback } from "@goraebap/ui-react/components/avatar";
import { Button } from "@goraebap/ui-react/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@goraebap/ui-react/components/collapsible";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@goraebap/ui-react/components/drawer";
import { Progress } from "@goraebap/ui-react/components/progress";
import { RadioGroup, RadioGroupItem } from "@goraebap/ui-react/components/radio-group";
import { Slider } from "@goraebap/ui-react/components/slider";
import { ToastProvider, useToastManager } from "@goraebap/ui-react/components/toast";
import { SystemIcon } from "@goraebap/ui-react/icons";

/* ── Radio Group ──────────────────────────────────────────────── */

const RADIO_OPTIONS = [
  { value: "app", label: "App Theme" },
  { value: "editorial", label: "Editorial Theme" },
  { value: "system", label: "시스템 기본값" },
];

export function NativeRadioGroupDemo() {
  const [value, setValue] = useState("app");
  return (
    <div className="border-border bg-card mx-auto max-w-xs rounded-xl border p-4">
      <div role="radiogroup" aria-label="기본 테마" className={radioGroupVariants()}>
        {RADIO_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="radio"
              name="native-theme-radio"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => setValue(opt.value)}
              className={radioItemVariants()}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function ReactRadioGroupDemo() {
  const [value, setValue] = useState("app");
  return (
    <div className="border-border bg-card mx-auto max-w-xs rounded-xl border p-4">
      <RadioGroup
        aria-label="기본 테마"
        value={value}
        onValueChange={(next) => setValue(String(next))}
      >
        {RADIO_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <RadioGroupItem value={opt.value} />
            <span>{opt.label}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

/* ── Accordion ────────────────────────────────────────────────── */

const FAQ_ITEMS = [
  {
    id: "tokens",
    title: "토큰은 어떻게 적용하나요?",
    body: "base.css와 테마 CSS를 앱 엔트리에 불러오면 모든 CSS 변수가 바로 활성화됩니다.",
  },
  {
    id: "icons",
    title: "아이콘 라이브러리를 바꿀 수 있나요?",
    body: "IconProvider에 solar 또는 lucide를 지정하면 컴포넌트 내부 시스템 아이콘이 함께 바뀝니다.",
  },
];

export function NativeAccordionDemo() {
  return (
    <div className="border-border bg-card mx-auto max-w-md rounded-xl border px-4">
      {FAQ_ITEMS.map((item, idx) => (
        <details
          key={item.id}
          name="native-accordion"
          open={idx === 0}
          className={`group ${accordionItemVariants()}`}
        >
          <summary className={`list-none ${accordionTriggerVariants()}`}>
            <span>{item.title}</span>
            <SystemIcon name="chevronDown" className="size-4 group-open:rotate-180" />
          </summary>
          <div className={accordionPanelVariants()}>{item.body}</div>
        </details>
      ))}
    </div>
  );
}

export function ReactAccordionDemo() {
  return (
    <div className="border-border bg-card mx-auto max-w-md rounded-xl border px-4">
      <Accordion defaultValue={["tokens"]}>
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>{item.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

/* ── Collapsible ──────────────────────────────────────────────── */

export function NativeCollapsibleDemo() {
  return (
    <div className="border-border bg-card mx-auto max-w-md rounded-xl border p-4">
      <details open className="group space-y-2">
        <summary className={`list-none ${collapsibleTriggerVariants()}`}>
          <span>고급 설정 보기</span>
          <SystemIcon name="chevronDown" className="size-3.5 group-open:rotate-180" />
        </summary>
        <div className={`px-2.5 ${collapsiblePanelVariants()}`}>
          캐시 만료 시간과 웹훅 재시도 정책을 필요할 때만 펼쳐서 수정합니다.
        </div>
      </details>
    </div>
  );
}

export function ReactCollapsibleDemo() {
  return (
    <div className="border-border bg-card mx-auto max-w-md rounded-xl border p-4">
      <Collapsible defaultOpen className="space-y-2">
        <CollapsibleTrigger>고급 설정 보기</CollapsibleTrigger>
        <CollapsibleContent className="px-2.5">
          캐시 만료 시간과 웹훅 재시도 정책을 필요할 때만 펼쳐서 수정합니다.
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/* ── Avatar ───────────────────────────────────────────────────── */

export function NativeAvatarDemo() {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <span className={avatarVariants({ size: "sm" })}>
        <span className={avatarFallbackVariants()}>GB</span>
      </span>
      <span className={avatarVariants({ size: "default" })}>
        <span className={avatarFallbackVariants()}>고래</span>
      </span>
      <span className={avatarVariants({ size: "lg" })}>
        <span className={avatarFallbackVariants()}>DS</span>
      </span>
    </div>
  );
}

export function ReactAvatarDemo() {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <Avatar size="sm">
        <AvatarFallback>GB</AvatarFallback>
      </Avatar>
      <Avatar size="default">
        <AvatarFallback>고래</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>DS</AvatarFallback>
      </Avatar>
    </div>
  );
}

/* ── Progress ─────────────────────────────────────────────────── */

export function NativeProgressDemo() {
  return (
    <div className="mx-auto max-w-sm space-y-2 py-4">
      <div className="flex justify-between text-xs">
        <span className="font-medium">동기화 진행률</span>
        <span className="text-muted-foreground font-mono">68%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={68}
        aria-valuemin={0}
        aria-valuemax={100}
        className={progressTrackVariants()}
      >
        <div className={progressIndicatorVariants()} style={{ width: "68%" }} />
      </div>
    </div>
  );
}

export function ReactProgressDemo() {
  return (
    <div className="mx-auto max-w-sm space-y-2 py-4">
      <div className="flex justify-between text-xs">
        <span className="font-medium">동기화 진행률</span>
        <span className="text-muted-foreground font-mono">68%</span>
      </div>
      <Progress value={68} />
    </div>
  );
}

/* ── Slider ───────────────────────────────────────────────────── */

export function ReactSliderDemo() {
  const [val, setVal] = useState(60);
  return (
    <div className="mx-auto max-w-sm space-y-2 py-4">
      <div className="flex justify-between text-xs">
        <span className="font-medium">불투명도</span>
        <span className="text-muted-foreground font-mono">{val}%</span>
      </div>
      <Slider
        aria-label="불투명도"
        value={val}
        onValueChange={(next) => setVal(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  );
}

/* ── Drawer ───────────────────────────────────────────────────── */

export function NativeDrawerDemo({ isMobile }: { isMobile: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const side = isMobile ? "bottom" : "right";
  return (
    <div className="flex items-center justify-center py-4">
      <button
        type="button"
        className={buttonVariants({ variant: "outline", size: "sm" })}
        onClick={() => ref.current?.showModal()}
      >
        드로어 열기
      </button>
      <dialog
        ref={ref}
        data-surface={`drawer-${side}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) ref.current?.close();
        }}
        className={`goraebap-native-dialog m-0 max-h-none ${
          isMobile ? "top-auto max-w-none" : "left-auto"
        } ${drawerPopupVariants({ side })}`}
      >
        <h3 className="pr-7 text-base font-semibold tracking-tight">필터 설정</h3>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
          화면 가장자리에서 슬라이드되어 보조 패널을 엽니다.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className={buttonVariants({ size: "sm" })}
            onClick={() => ref.current?.close()}
          >
            적용
          </button>
        </div>
        <button
          type="button"
          aria-label="닫기"
          className={dialogCloseButtonVariants()}
          onClick={() => ref.current?.close()}
        >
          <SystemIcon name="close" className="size-4" />
        </button>
      </dialog>
    </div>
  );
}

export function ReactDrawerDemo({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex items-center justify-center py-4">
      <Drawer swipeDirection={isMobile ? "down" : "right"}>
        <DrawerTrigger render={<Button variant="outline" size="sm" />}>드로어 열기</DrawerTrigger>
        <DrawerContent side={isMobile ? "bottom" : "right"}>
          <DrawerTitle>필터 설정</DrawerTitle>
          <DrawerDescription>화면 가장자리에서 슬라이드되어 보조 패널을 엽니다.</DrawerDescription>
          <div className="mt-5 flex justify-end">
            <DrawerClose render={<Button size="sm" />}>적용</DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/* ── Toast ────────────────────────────────────────────────────── */

function ReactToastTrigger() {
  const toastManager = useToastManager();
  return (
    <div className="flex items-center justify-center py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toastManager.add({
            title: "설정이 저장되었습니다",
            description: "변경 사항이 즉시 반영됩니다.",
          })
        }
      >
        알림 띄우기
      </Button>
    </div>
  );
}

export function ReactToastDemo() {
  return (
    <ToastProvider>
      <ReactToastTrigger />
    </ToastProvider>
  );
}
