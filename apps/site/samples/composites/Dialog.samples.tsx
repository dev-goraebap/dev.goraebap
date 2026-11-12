import type { Meta, SampleOf } from "../catalog/types";
import { focusFirstInvalid } from "@/shared/lib/focus-invalid";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { FormDialog } from "@/shared/ui/form-dialog";
import { XIcon } from "@/shared/ui/icon";
import { Input } from "@/shared/ui/input";
import { useId, useRef, useState } from "react";

const paragraphs = ["자료를 정리할 때 다시 볼 기준을 남깁니다.", "긴 본문은 대화상자 안에서만 스크롤하고 제목과 닫기, 바닥의 동작은 그대로 보입니다.",
  "화면 높이가 짧아도 마지막 동작에 닿아야 합니다.", "키보드로 닫으면 초점은 열었던 버튼으로 돌아갑니다."];

/**
 * 머리 · 스크롤 본문 · 바닥의 한 틀. 키트에 이 틀이 아직 없어 shadcn Dialog로 짓는다(옛 AppDialog와 같은 배치).
 * 창 위 12dvh에 두고 아래에도 같은 여유를 남겨 긴 본문에서도 제목 · 닫기 · 마지막 동작에 닿는다. 열면 제목에 초점을 둔다.
 */
export function Basic({ isLong = false, hasFooterDivider = false }: { isLong?: boolean; hasFooterDivider?: boolean }) {
  const [isOpen, setOpen] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const bodyId = useId();
  const texts = isLong ? Array.from({ length: 6 }, () => paragraphs).flat() : paragraphs.slice(0, 2);
  return <>
    <Button onClick={() => setOpen(true)}>대화상자 열기</Button>
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} initialFocus={title} aria-describedby={bodyId}
        className="top-[12dvh] flex max-h-[76dvh] translate-y-0 flex-col gap-0 p-0 sm:max-w-md">
        <header className="flex items-center gap-3 px-4 pt-4 pb-2">
          <DialogTitle ref={title} tabIndex={-1} className="min-w-0 flex-1 text-base font-semibold outline-none">자료 정리 기준</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기" className="max-md:size-11" />}><XIcon /></DialogClose>
        </header>
        <div id={bodyId} className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 pt-2 pb-4 text-sm">
          {texts.map((text, index) => <p key={index}>{text}</p>)}
        </div>
        <footer className={cn("flex justify-end gap-2 px-4 pb-4", hasFooterDivider && "border-t pt-4")}>
          <Button onClick={() => setOpen(false)} className="max-md:h-11">확인</Button>
        </footer>
      </DialogContent>
    </Dialog>
  </>;
}

/** 되돌릴 수 없는 삭제의 확인: 데스크톱은 가운데 확인 창, 휴대폰은 바텀시트. 처음 초점은 취소에 있다. */
export function Confirm() {
  const [isOpen, setOpen] = useState(false);
  return <>
    <Button variant="destructive" onClick={() => setOpen(true)}>자료 삭제</Button>
    <ConfirmDialog open={isOpen} onOpenChange={setOpen} title="자료를 삭제할까요?" description="삭제한 자료는 되돌릴 수 없습니다."
      action={{ label: "삭제", onAction: () => setOpen(false) }} />
  </>;
}

/** 짧은 양식: 제출을 막지 않고, 누르면 빠진 칸에 aria-invalid와 설명을 붙인 뒤 그 칸으로 초점을 옮긴다. */
function ShortForm() {
  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState("디자인 참고");
  const [isTried, setTried] = useState(false);
  const id = useId();
  const isInvalid = isTried && !name.trim();
  const submit = () => { if (!name.trim()) { setTried(true); focusFirstInvalid(); return; } setOpen(false); };
  return <>
    <Button variant="secondary" onClick={() => setOpen(true)}>이름 바꾸기</Button>
    <FormDialog open={isOpen} onOpenChange={next => { if (!next) setTried(false); setOpen(next); }} title="컬렉션 이름 바꾸기" submitLabel="바꾸기" onSubmit={submit}>
      <Field data-invalid={isInvalid || undefined}>
        <FieldLabel htmlFor={id}>이름</FieldLabel>
        <Input id={id} value={name} onChange={event => setName(event.target.value)} autoFocus aria-invalid={isInvalid || undefined}
          aria-describedby={isInvalid ? `${id}-error` : undefined} />
        {isInvalid ? <FieldError id={`${id}-error`}>이름을 입력해 주세요.</FieldError> : null}
      </Field>
    </FormDialog>
  </>;
}

const meta = {
  title: "Composites (조합 부품)/공통 다이얼로그", id: "composites-dialog",
  layout: "centered", height: "28rem",
} satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Default: Sample = { name: "기본", render: () => <Basic /> };
export const LongBody: Sample = { name: "긴 본문", render: () => <Basic isLong /> };
export const FooterDivider: Sample = { name: "바닥 구분선", render: () => <Basic isLong hasFooterDivider /> };
export const Alert: Sample = { name: "확인 창", render: () => <Confirm /> };
export const Form: Sample = { name: "짧은 양식", render: () => <ShortForm /> };
