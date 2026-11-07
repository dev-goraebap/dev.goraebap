import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@astryxdesign/core/Button";
import { ActionMenu } from "@kit/composites/popup/ActionMenu";
import { AdaptivePopover } from "@kit/composites/popup/AdaptivePopover";
import { RowMenu } from "@kit/composites/popup/RowMenu";
import { icon } from "@kit/foundations/icons/solar-icon";
import { useState } from "react";
import { Comparison } from "../catalog/Comparison";

function ChoiceMenu() {
  const [chosen, setChosen] = useState("updated");
  return <AdaptivePopover label="정렬" trigger={<Button label="정렬" variant="view" icon={icon("sort")} />}
    content={close => <ActionMenu title="정렬" onDone={close} actions={[
      { id: "updated", label: "수정일", icon: "clock", isChosen: chosen === "updated", onSelect: () => setChosen("updated") },
      { id: "title", label: "제목", icon: "document", isChosen: chosen === "title", onSelect: () => setChosen("title") },
    ]} />} />;
}

const meta = { title: "Composites (조합 부품)/사용 기준", id: "composites-overview", layout: "centered", height: "16rem" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Menus: Sample = {
  name: "곁에 여는 메뉴",
  render: () => <Comparison items={[
    { label: "선택 메뉴", content: <ChoiceMenu /> },
    { label: "행 메뉴", content: <RowMenu label="자료 메뉴" actions={[{ id: "edit", label: "수정", icon: "edit" }, { id: "delete", label: "삭제", icon: "delete" }]} /> },
  ]} />,
};
export const MenusOnPhone: Sample = { ...Menus, name: "휴대폰 바텀시트", device: "phone" };
