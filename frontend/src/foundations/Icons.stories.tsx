import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "./Icon";
import { solarIcons } from "./solar-icons";
const meta = {
  title: "디자인 기초/아이콘",
  id: "foundations-icons",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Selection: Story = {
  name: "기본·선택형",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
        gap: "1rem",
      }}
    >
      {(Object.keys(solarIcons) as (keyof typeof solarIcons)[]).map((name) => (
        <div
          key={name}
          style={{
            display: "flex",
            gap: ".75rem",
            padding: ".75rem",
            alignItems: "center",
          }}
        >
          <Icon name={name} size={24} />
          <Icon name={name} size={24} selected />
          <span>{name}</span>
        </div>
      ))}
    </div>
  ),
};
export const Sizes: Story = {
  name: "같은 의미의 크기 비교",
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      {[16, 20, 24, 32].map((size) => (
        <div
          key={size}
          style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
        >
          <Icon name="document" size={size} />
          <span>{size / 16}rem</span>
        </div>
      ))}
    </div>
  ),
};
