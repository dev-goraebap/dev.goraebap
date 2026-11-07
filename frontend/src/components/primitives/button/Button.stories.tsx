import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "../../../foundations/Icon";
import { Comparison } from "../../../../.storybook/Comparison";
const meta = {
  title: "기본 부품/버튼",
  id: "primitives-button",
  component: Button,
  parameters: { layout: "centered", docs: { story: { height: "180px" } } },
  args: { label: "저장", variant: "primary" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "ghost", "create", "tool", "view", "view-active"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = { name: "기본 동작" };
export const Cancel: Story = {
  name: "취소",
  args: { label: "취소", variant: "ghost" },
};
export const Create: Story = {
  name: "헤더·툴바 생성",
  args: { label: "자료 추가", variant: "create", icon: <Icon name="plus" /> },
};
export const Tool: Story = {
  name: "아이콘 도구",
  args: {
    label: "검색",
    variant: "tool",
    isIconOnly: true,
    icon: <Icon name="search" />,
  },
};
export const Disabled: Story = { name: "비활성", args: { isDisabled: true } };
export const Loading: Story = { name: "처리 중", args: { isLoading: true } };
export const Sizes: Story = {
  name: "크기 비교",
  render: () => (
    <Comparison
      items={(["sm", "md", "lg"] as const).map((size) => ({
        label: size,
        content: <Button label="저장" size={size} />,
      }))}
    />
  ),
};
export const Variants: Story = {
  name: "역할·변형 비교",
  render: () => (
    <Comparison
      items={[
        {
          label: "주요 동작",
          content: <Button label="저장" variant="primary" />,
        },
        { label: "취소", content: <Button label="취소" variant="ghost" /> },
        {
          label: "헤더·툴바 생성",
          content: (
            <Button
              label="자료 추가"
              variant="create"
              icon={<Icon name="plus" />}
            />
          ),
        },
        {
          label: "아이콘 도구",
          content: (
            <Button
              label="검색"
              isIconOnly
              variant="tool"
              icon={<Icon name="search" />}
            />
          ),
        },
        {
          label: "선택한 뷰",
          content: (
            <Button
              label="문서"
              variant="view-active"
              icon={<Icon name="document" selected />}
            />
          ),
        },
      ]}
    />
  ),
};
export const States: Story = {
  name: "상태 비교",
  render: () => (
    <Comparison
      items={[
        { label: "기본", content: <Button label="저장" /> },
        { label: "비활성", content: <Button label="저장" isDisabled /> },
        { label: "처리 중", content: <Button label="저장" isLoading /> },
      ]}
    />
  ),
};
