import { useRef, useState } from "react";
import { X } from "lucide-react";
import { buttonVariants } from "@goraebap/design-system/recipes/button";
import { checkboxVariants } from "@goraebap/design-system/recipes/checkbox";
import {
  dialogCloseButtonVariants,
  dialogPopupVariants,
  dialogSheetHandleVariants,
} from "@goraebap/design-system/recipes/dialog";
import { inputVariants } from "@goraebap/design-system/recipes/input";
import { switchThumbVariants, switchTrackVariants } from "@goraebap/design-system/recipes/switch";
import { tabsListVariants, tabsTriggerVariants } from "@goraebap/design-system/recipes/tabs";
import { Button } from "@goraebap/ui-react/components/button";
import { Checkbox } from "@goraebap/ui-react/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@goraebap/ui-react/components/dialog";
import { Input } from "@goraebap/ui-react/components/input";
import { Switch } from "@goraebap/ui-react/components/switch";

/* ── React (Base UI) Interactive Demos ─────────────────────────── */

export function ReactSwitchDemo() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="border-border bg-card mx-auto flex max-w-sm items-center justify-between rounded-xl border p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">이메일 알림 받기</p>
        <p className="text-muted-foreground text-xs">상태: {enabled ? "켜짐" : "꺼짐"}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="이메일 알림 받기" />
    </div>
  );
}

export function ReactCheckboxDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <div className="border-border bg-card mx-auto flex max-w-sm items-start gap-3 rounded-xl border p-4">
      <Checkbox
        id="react-agree-demo"
        checked={checked}
        onCheckedChange={setChecked}
        className="mt-0.5"
      />
      <label htmlFor="react-agree-demo" className="cursor-pointer space-y-0.5">
        <span className="block text-sm font-medium">모든 기기 세션 유지</span>
        <span className="text-muted-foreground block text-xs">
          선택됨: {checked ? "예" : "아니오"}
        </span>
      </label>
    </div>
  );
}

export function ReactDialogDemo({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <Dialog>
        <DialogTrigger
          render={
            <Button
              className={isMobile ? "w-full" : undefined}
              size={isMobile ? "lg" : "default"}
            />
          }
        >
          {isMobile ? "모바일 바텀시트 열기" : "대화상자 열기"}
        </DialogTrigger>
        <DialogContent surface={isMobile ? "sheet" : "dialog"}>
          <DialogTitle>프로젝트 이름 바꾸기</DialogTitle>
          <DialogDescription>
            {isMobile
              ? "휴대폰(64rem 미만)에서는 짧은 양식을 하단 바텀시트로 엽니다."
              : "데스크톱(64rem 이상)에서는 화면 중앙의 대화상자로 엽니다."}
          </DialogDescription>
          <div className="mt-4 space-y-3">
            <Input defaultValue="dev.goraebap" aria-label="프로젝트 이름" />
            <div className="flex justify-end gap-2">
              <DialogClose render={<Button variant="ghost" size="sm" />}>취소</DialogClose>
              <DialogClose render={<Button size="sm" />}>저장</DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Pure HTML Native Demos (Token + Recipe Only) ──────────────── */

export function NativeDialogDemo({ isMobile }: { isMobile: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const surface = isMobile ? "sheet" : "dialog";

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button
        type="button"
        className={`${buttonVariants({ size: isMobile ? "lg" : "default" })} ${isMobile ? "w-full" : ""}`}
        onClick={() => dialogRef.current?.showModal()}
      >
        {isMobile ? "모바일 바텀시트 열기" : "대화상자 열기"}
      </button>
      <dialog
        ref={dialogRef}
        data-surface={surface}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
        className={`goraebap-native-dialog m-0 max-h-none max-w-none ${
          isMobile ? "top-auto" : ""
        } ${dialogPopupVariants({ surface })}`}
      >
        {isMobile && <div aria-hidden="true" className={dialogSheetHandleVariants()} />}
        <h3 className="pr-7 text-base font-semibold tracking-tight">프로젝트 이름 바꾸기</h3>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
          {isMobile
            ? "휴대폰(64rem 미만)에서는 짧은 양식을 하단 바텀시트로 엽니다."
            : "데스크톱(64rem 이상)에서는 화면 중앙의 대화상자로 엽니다."}
        </p>
        <div className="mt-4 space-y-3">
          <input
            type="text"
            defaultValue="dev.goraebap"
            aria-label="프로젝트 이름"
            className={inputVariants()}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              onClick={() => dialogRef.current?.close()}
            >
              취소
            </button>
            <button
              type="button"
              className={buttonVariants({ size: "sm" })}
              onClick={() => dialogRef.current?.close()}
            >
              저장
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="닫기"
          className={dialogCloseButtonVariants()}
          onClick={() => dialogRef.current?.close()}
        >
          <X className="size-4" />
        </button>
      </dialog>
    </div>
  );
}

export function NativeSwitchDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <div className="border-border bg-card mx-auto flex max-w-sm items-center justify-between rounded-xl border p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">이메일 알림 받기</p>
        <p className="text-muted-foreground text-xs">상태: {checked ? "켜짐" : "꺼짐"}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="이메일 알림 받기"
        data-checked={checked ? "" : undefined}
        onClick={() => setChecked((prev) => !prev)}
        className={switchTrackVariants()}
      >
        <span data-checked={checked ? "" : undefined} className={switchThumbVariants()} />
      </button>
    </div>
  );
}

export function NativeCheckboxDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <div className="border-border bg-card mx-auto flex max-w-sm items-start gap-3 rounded-xl border p-4">
      <input
        id="native-checkbox-demo"
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className={`mt-0.5 ${checkboxVariants()}`}
      />
      <label htmlFor="native-checkbox-demo" className="cursor-pointer space-y-0.5">
        <span className="block text-sm font-medium">모든 기기 세션 유지</span>
        <span className="text-muted-foreground block text-xs">
          선택됨: {checked ? "예" : "아니오"}
        </span>
      </label>
    </div>
  );
}

export function NativeTabsDemo() {
  const [tab, setTab] = useState<"react" | "angular" | "tokens">("react");
  return (
    <div className="border-border bg-card mx-auto max-w-md rounded-xl border p-5">
      <div role="tablist" aria-label="프레임워크 탭 예제" className={tabsListVariants()}>
        {(
          [
            { id: "react", label: "React" },
            { id: "angular", label: "Angular" },
            { id: "tokens", label: "Tokens" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            data-selected={tab === item.id ? "" : undefined}
            onClick={() => setTab(item.id)}
            className={tabsTriggerVariants()}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="text-muted-foreground mt-3 text-xs leading-relaxed">
        {tab === "react" && (
          <>
            React는 Base UI 프리미티브 위에{" "}
            <code className="font-mono">@goraebap/design-system</code> 레시피를 입힙니다.
          </>
        )}
        {tab === "angular" && (
          <>
            Angular는 <code className="font-mono">@spartan-ng/brain</code> 위에 완전히 같은 CVA
            레시피를 입힙니다.
          </>
        )}
        {tab === "tokens" &&
          "색상·면 위계·반경은 순수 CSS 변수로 양쪽 프레임워크가 동일하게 공유합니다."}
      </div>
    </div>
  );
}
