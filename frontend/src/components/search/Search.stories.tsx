import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchTool } from "./SearchTool";
const meta = {
  title: "컴포넌트/검색",
  component: SearchTool,
  args: { value: "", onChange: () => {} },
  parameters: { layout: "padded" },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <SearchTool {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof SearchTool>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = { name: "접힌 검색" };
export const WithQuery: Story = {
  name: "검색어 있음",
  args: { value: "인터페이스" },
};
