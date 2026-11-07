import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@astryxdesign/core/Badge";
import { Icon } from "../../../foundations/Icon";
import { Comparison } from "../../../../.storybook/Comparison";
const meta = {
  title: "기본 부품/뱃지",
  id: "primitives-badge",
  component: Badge,
  parameters: { layout: "centered", docs: { story: { height: "180px" } } },
  args: { label: "문서", icon: <Icon name="document" /> },
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "info", "success", "error", "purple"],
    },
  },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Label: Story = { name: "아이콘과 분류" };
export const Text: Story = {
  name: "텍스트",
  args: { label: "디자인 참고", icon: undefined },
};
export const Status: Story = {
  name: "상태",
  args: { label: "완료", variant: "success", icon: undefined },
};
export const Variants: Story = {
  name: "변형 비교",
  render: () => (
    <Comparison
      items={(["neutral", "info", "success", "error", "purple"] as const).map(
        (variant) => ({
          label: variant,
          content: (
            <Badge
              label="문서"
              variant={variant}
              icon={<Icon name="document" />}
            />
          ),
        }),
      )}
    />
  ),
};
