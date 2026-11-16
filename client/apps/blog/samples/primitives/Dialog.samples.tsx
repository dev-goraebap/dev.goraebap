import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";

/** shadcn Dialog(Base UI) 그대로. 제품 화면은 이 부품을 직접 쓰지 않고 공통 다이얼로그(짧은 양식 · 확인 창 · 상세 면)를 쓴다. */
function Primitive() {
  return <Dialog>
    <DialogTrigger render={<Button />}>Dialog 열기</DialogTrigger>
    <DialogContent className="sm:max-w-96">
      <DialogHeader>
        <DialogTitle>기본 Dialog</DialogTitle>
        <DialogDescription>제품 화면은 공통 다이얼로그를 쓰고 이 부품을 직접 쓰지 않습니다.</DialogDescription>
      </DialogHeader>
      <DialogFooter><DialogClose render={<Button />}>닫기</DialogClose></DialogFooter>
    </DialogContent>
  </Dialog>;
}
const meta = { title: "Primitives (기본 부품)/Dialog", id: "primitives-dialog", layout: "centered", height: "22rem" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;
export const Basic: Sample = { name: "shadcn 기본 모달", render: () => <Primitive /> };
