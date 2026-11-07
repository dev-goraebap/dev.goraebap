import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Comparison } from "../../../../.storybook/Comparison";
const meta = {
  title: "기본 부품/아바타",
  id: "primitives-avatar",
  component: Avatar,
  parameters: { layout: "centered", docs: { story: { height: "180px" } } },
  args: { name: "서윤", size: "sm" },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Fallback: Story = { name: "이미지 없는 사용자" };
export const Named: Story = {
  name: "이름과 식별",
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
      <Avatar {...args} />
      <span>{args.name}</span>
    </div>
  ),
};
export const Sizes: Story = {
  name: "크기 비교",
  render: () => (
    <Comparison
      items={(["xsm", "sm", "md", "lg"] as const).map((size) => ({
        label: size,
        content: <Avatar name="서윤" size={size} />,
      }))}
    />
  ),
};
