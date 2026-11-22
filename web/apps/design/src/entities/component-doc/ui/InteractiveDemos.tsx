import { useRef, useState } from "react";
import { buttonVariants } from "@goraebap/design-system/recipes/button";
import { checkboxVariants } from "@goraebap/design-system/recipes/checkbox";
import { dialogPopupVariants } from "@goraebap/design-system/recipes/dialog";
import { inputVariants } from "@goraebap/design-system/recipes/input";
import { switchThumbVariants, switchTrackVariants } from "@goraebap/design-system/recipes/switch";
import { tabsListVariants, tabsTriggerVariants } from "@goraebap/design-system/recipes/tabs";
import { Button } from "@goraebap/ui/components/button";
import { Checkbox } from "@goraebap/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@goraebap/ui/components/dialog";
import { Input } from "@goraebap/ui/components/input";
import { Switch } from "@goraebap/ui/components/switch";

/* ── React (Base UI) Interactive Demos ─────────────────────────── */

export function ReactSwitchDemo() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="border-border bg-card mx-auto flex max-w-sm items-center justify-between rounded-xl border p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">이메일 알림 받기</p>
        <p className="text-muted-foreground text-xs">Base UI 상태: {enabled ? "켜짐" : "꺼짐"}</p>
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
      <p className="text-muted-foreground text-xs">
        현재 모드: {isMobile ? "Mobile (Bottom Sheet)" : "Desktop (Centered Dialog)"}
      </p>
    </div>
  );
}

/* ── Pure HTML Native Demos (Token + Recipe Only) ──────────────── */

export function NativeDialogDemo({ isMobile }: { isMobile: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button
        type="button"
        className={`${buttonVariants({ size: isMobile ? "lg" : "default" })} ${isMobile ? "w-full" : ""}`}
        onClick={() => dialogRef.current?.showModal()}
      >
        {isMobile ? "네이티브 바텀시트 열기" : "네이티브 <dialog> 열기"}
      </button>
      <p className="text-muted-foreground text-center text-xs">
        프레임워크 없이 브라우저 기본 <code>&lt;dialog&gt;.showModal()</code> +{" "}
        <code>dialogPopupVariants()</code>로 동작합니다. (ESC 닫기 지원)
      </p>
      <dialog
        ref={dialogRef}
        className={`goraebap-native-dialog m-0 max-w-none backdrop:bg-black/55 ${
          isMobile ? "top-auto" : ""
        } ${dialogPopupVariants({
          surface: isMobile ? "sheet" : "dialog",
        })}`}
      >
        <h3 className="text-base font-semibold tracking-tight">네이티브 HTML 대화상자</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Base UI 없이도 1·2단계 디자인 토큰과 레시피만으로 동일한 외형과 ESC 닫기를 구현할 수
          있습니다.
        </p>
        <div className="mt-4 space-y-3">
          <input
            type="text"
            defaultValue="pure-html-demo"
            aria-label="이름"
            className={inputVariants()}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              onClick={() => dialogRef.current?.close()}
            >
              닫기
            </button>
            <button
              type="button"
              className={buttonVariants({ size: "sm" })}
              onClick={() => dialogRef.current?.close()}
            >
              확인
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export function NativeSwitchDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <div className="border-border bg-card mx-auto flex max-w-sm items-center justify-between rounded-xl border p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">네이티브 스위치</p>
        <p className="text-muted-foreground text-xs">
          &lt;button role=&quot;switch&quot;&gt; · {checked ? "켜짐" : "꺼짐"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="네이티브 스위치"
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
        className={`mt-0.5 accent-current ${checkboxVariants()}`}
      />
      <label htmlFor="native-checkbox-demo" className="cursor-pointer space-y-0.5">
        <span className="block text-sm font-medium">
          네이티브 &lt;input type=&quot;checkbox&quot;&gt;
        </span>
        <span className="text-muted-foreground block text-xs">
          선택됨: {checked ? "예" : "아니오"}
        </span>
      </label>
    </div>
  );
}

export function NativeTabsDemo() {
  const [tab, setTab] = useState<"tokens" | "recipes" | "html">("tokens");
  return (
    <div className="border-border bg-card mx-auto max-w-md space-y-3 rounded-xl border p-5">
      <div role="tablist" aria-label="네이티브 탭 예제" className={tabsListVariants()}>
        {(
          [
            { id: "tokens", label: "Tokens" },
            { id: "recipes", label: "Recipes" },
            { id: "html", label: "Pure HTML" },
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
      <div role="tabpanel" className="text-muted-foreground text-xs leading-relaxed">
        {tab === "tokens" && "1단계 CSS 변수는 프레임워크와 완전히 무관하게 동작합니다."}
        {tab === "recipes" &&
          "2단계 CVA 레시피는 순수 HTML 요소의 class에 그대로 입힐 수 있습니다."}
        {tab === "html" &&
          "단, 좌우 화살표 키보드 이동(Roving Focus)까지 일관되게 처리하려면 3단계 헤드리스 프리미티브가 필요합니다."}
      </div>
    </div>
  );
}
