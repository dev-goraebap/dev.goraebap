import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@astryxdesign/core/Button";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useState } from "react";

function Primitive() {
  const [isOpen, setOpen] = useState(false);
  return <>
    <Button label="Dialog 열기" onClick={() => setOpen(true)} />
    <Dialog isOpen={isOpen} onOpenChange={setOpen} aria-label="기본 Dialog" width="24rem">
      <VStack gap={3}><Text>제품 화면은 공통 다이얼로그를 쓰고 이 부품을 직접 쓰지 않습니다.</Text><Button label="닫기" onClick={() => setOpen(false)} /></VStack>
    </Dialog>
  </>;
}
const meta = { title: "Primitives (기본 부품)/Dialog", id: "primitives-dialog", layout: "centered", height: "22rem" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;
export const Basic: Sample = { name: "Astryx 기본 모달", render: () => <Primitive /> };
