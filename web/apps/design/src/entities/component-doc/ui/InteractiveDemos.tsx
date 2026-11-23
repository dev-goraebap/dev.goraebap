import { useState } from "react";
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
