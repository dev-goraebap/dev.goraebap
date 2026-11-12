import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { AlertDialog } from "@/shared/ui/composites/dialog/AlertDialog";
import { AppDialog } from "@/shared/ui/composites/dialog/AppDialog";
import { FormDialog } from "@/shared/ui/composites/dialog/FormDialog";
import { focusFirstInvalid } from "@/shared/ui/patterns/compose/validation";
import { useState } from "react";

const paragraphs = ["자료를 정리할 때 다시 볼 기준을 남깁니다.", "긴 본문은 대화상자 안에서만 스크롤하고 제목과 닫기, 바닥의 동작은 그대로 보입니다.",
  "화면 높이가 짧아도 마지막 동작에 닿아야 합니다.", "키보드로 닫으면 초점은 열었던 버튼으로 돌아갑니다."];

export function Basic({ isLong = false, hasFooterDivider = false }: { isLong?: boolean; hasFooterDivider?: boolean }) {
  const [isOpen, setOpen] = useState(false);
  return <>
    <Button label="대화상자 열기" onClick={() => setOpen(true)} />
    <AppDialog isOpen={isOpen} onOpenChange={setOpen} title="자료 정리 기준" width="28rem" hasFooterDivider={hasFooterDivider}
      footer={<Button label="확인" onClick={() => setOpen(false)} />}>
      <VStack gap={3}>{(isLong ? Array.from({ length: 6 }, () => paragraphs).flat() : paragraphs.slice(0, 2)).map((text, index) => <Text key={index}>{text}</Text>)}</VStack>
    </AppDialog>
  </>;
}

export function Confirm() {
  const [isOpen, setOpen] = useState(false);
  return <>
    <Button label="자료 삭제" variant="destructive" onClick={() => setOpen(true)} />
    <AlertDialog isOpen={isOpen} onOpenChange={setOpen} title="자료를 삭제할까요?" description="삭제한 자료는 되돌릴 수 없습니다." actionLabel="삭제" onAction={() => setOpen(false)} />
  </>;
}

function ShortForm() {
  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState("디자인 참고");
  const [isTried, setTried] = useState(false);
  const submit = () => { if (!name.trim()) { setTried(true); focusFirstInvalid(); return; } setOpen(false); };
  return <>
    <Button label="이름 바꾸기" variant="secondary" onClick={() => setOpen(true)} />
    {isOpen ? <FormDialog title="컬렉션 이름 바꾸기" submitLabel="바꾸기" onClose={() => { setTried(false); setOpen(false); }} onSubmit={submit}>
      <TextInput label="이름" value={name} onChange={setName} hasAutoFocus
        status={isTried && !name.trim() ? { type: "error", message: "이름을 입력해 주세요." } : undefined} />
    </FormDialog> : null}
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

