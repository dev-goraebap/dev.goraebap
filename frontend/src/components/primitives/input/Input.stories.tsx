import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Comparison } from "../../../../.storybook/Comparison";
const meta = {
  title: "기본 부품/입력",
  id: "primitives-input",
  component: TextInput,
  parameters: { layout: "centered", docs: { story: { height: "180px" } } },
  args: { label: "이름", value: "", placeholder: "이름을 입력하세요" },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <div style={{ width: "min(20rem, calc(100vw - 2rem))" }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>
    );
  },
} satisfies Meta<typeof TextInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "레이블과 입력" };
export const Required: Story = { name: "필수 값", args: { isRequired: true } };
export const ReadOnly: Story = {
  name: "읽기 전용",
  args: { value: "서윤", isReadOnly: true },
};
export const States: Story = {
  name: "입력 상태 비교",
  parameters: { docs: { story: { height: "240px" } } },
  render: () => {
    const [value, setValue] = useState("서윤");
    return (
      <Comparison
        items={[
          {
            label: "입력 가능",
            content: (
              <div style={{ width: "13rem", maxWidth: "100%" }}>
                <TextInput label="이름" value={value} onChange={setValue} />
              </div>
            ),
          },
          {
            label: "읽기 전용",
            content: (
              <div style={{ width: "13rem", maxWidth: "100%" }}>
                <TextInput label="이름" value="서윤" isReadOnly />
              </div>
            ),
          },
          {
            label: "비활성",
            content: (
              <div style={{ width: "13rem", maxWidth: "100%" }}>
                <TextInput label="이름" value="서윤" isDisabled />
              </div>
            ),
          },
        ]}
      />
    );
  },
};
