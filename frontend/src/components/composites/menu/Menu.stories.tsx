import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AdaptiveMenu } from "./AdaptiveMenu";
import { Icon } from "../../../foundations/Icon";
function Menu() {
  const [selected, setSelected] = useState("list");
  return (
    <AdaptiveMenu
      button={{ label: "표시", icon: <Icon name="sort" />, isIconOnly: true }}
      items={[
        {
          label: "리스트",
          icon: <Icon name="list" />,
          selected: selected === "list",
          onClick: () => setSelected("list"),
        },
        {
          label: "그리드",
          icon: <Icon name="grid" />,
          selected: selected === "grid",
          onClick: () => setSelected("grid"),
        },
      ]}
    />
  );
}
const meta = {
  title: "조합 부품/선택 메뉴",
  component: Menu,
  parameters: { layout: "centered", docs: { story: { height: "260px" } } },
} satisfies Meta<typeof Menu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = { name: "데스크톱 팝오버" };
export const Mobile: Story = {
  name: "모바일 바텀시트",
  globals: { viewport: { value: "iphone14", isRotated: false } },
};
