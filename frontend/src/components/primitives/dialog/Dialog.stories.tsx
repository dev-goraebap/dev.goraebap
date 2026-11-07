import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@astryxdesign/core/Button";
import { Dialog } from "@astryxdesign/core/Dialog";
function PrimitiveDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="Dialog 열기" onClick={() => setOpen(true)} />
      <Dialog
        isOpen={open}
        onOpenChange={setOpen}
        aria-label="기본 Dialog"
        width="28rem"
      >
        <p>이 부품은 모달의 열림과 닫힘·초점 경계를 제공합니다.</p>
        <Button label="닫기" onClick={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
const meta = {
  title: "기본 부품/Dialog",
  id: "primitives-dialog",
  component: PrimitiveDialog,
  parameters: { layout: "centered", docs: { story: { height: "360px" } } },
} satisfies Meta<typeof PrimitiveDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Basic: Story = { name: "Astryx 기본 모달" };
