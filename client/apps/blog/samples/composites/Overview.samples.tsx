import type { Meta, SampleOf } from "../catalog/types";
import { ActionMenu } from "@/shared/ui/action-menu";
import { AdaptivePopover } from "@/shared/ui/adaptive-popover";
import { Button } from "@/shared/ui/button";
import { ClockIcon, FileTextIcon, PencilIcon, SortIcon, Trash2Icon } from "@/shared/ui/icon";
import { OptionList } from "@/shared/ui/option-list";
import { useState } from "react";
import { Comparison } from "../catalog/Comparison";

/** 고르는 메뉴: 데스크톱은 곁에 뜨는 팝오버, 휴대폰(64rem 미만)은 같은 내용의 바텀시트. 하나를 고르면 닫힌다. */
function ChoiceMenu() {
  const [chosen, setChosen] = useState("updated");
  const [isOpen, setOpen] = useState(false);
  return <AdaptivePopover title="정렬" open={isOpen} onOpenChange={setOpen} className="w-52 p-1.5"
    trigger={<Button variant={isOpen ? "view-active" : "view"} className="max-md:h-11"><SortIcon chosen={isOpen} data-icon="inline-start" />정렬</Button>}>
    <OptionList label="정렬 고르기" chosen={[chosen]} onPick={value => { setChosen(value); setOpen(false); }}
      options={[{ value: "updated", label: "수정일", icon: <ClockIcon /> }, { value: "title", label: "제목", icon: <FileTextIcon /> }]} />
  </AdaptivePopover>;
}

const meta = { title: "Composites (조합 부품)/사용 기준", id: "composites-overview", layout: "centered", height: "16rem" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Menus: Sample = {
  name: "곁에 여는 메뉴",
  render: () => <Comparison items={[
    { label: "선택 메뉴", content: <ChoiceMenu /> },
    { label: "행 메뉴", content: <ActionMenu label="자료 메뉴" size="row"
      actions={[{ label: "수정", icon: PencilIcon, onSelect: () => {} }, { label: "삭제", icon: Trash2Icon, onSelect: () => {} }]} /> },
  ]} />,
};
