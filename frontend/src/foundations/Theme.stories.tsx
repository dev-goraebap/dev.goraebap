import type { Meta, StoryObj } from "@storybook/react-vite";
const meta = {
  title: "디자인 기초/테마와 색상",
  id: "foundations-theme",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Surfaces: Story = {
  name: "면과 경계",
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: "42rem" }}>
      {(["body", "surface", "card", "popover"] as const).map((name) => (
        <div
          key={name}
          style={{
            padding: "1rem",
            border: "1px solid var(--color-border)",
            background: `var(--color-background-${name})`,
          }}
        >
          <strong>{name}</strong>
          <p style={{ color: "var(--color-text-secondary)" }}>
            같은 의미 토큰을 라이트·다크에서 비교합니다.
          </p>
        </div>
      ))}
    </div>
  ),
};
