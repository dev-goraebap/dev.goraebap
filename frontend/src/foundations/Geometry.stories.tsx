import type { Meta, StoryObj } from "@storybook/react-vite";
const meta = {
  title: "디자인 기초/글자와 간격",
  id: "foundations-geometry",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Typography: Story = {
  name: "정보의 위계",
  render: () => (
    <article style={{ maxWidth: "45rem" }}>
      <h1>자료를 읽는 화면</h1>
      <p>제목과 본문, 보조 정보는 각자의 역할에 맞는 크기와 색을 사용합니다.</p>
      <p style={{ color: "var(--color-text-secondary)" }}>서윤 · 오늘 수정</p>
    </article>
  ),
};
export const Spacing: Story = {
  name: "간격과 정렬선",
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: "40rem" }}>
      {[0.25, 0.5, 0.75, 1, 1.5, 2].map((value) => (
        <div
          key={value}
          style={{ display: "flex", gap: "1rem", alignItems: "center" }}
        >
          <span style={{ inlineSize: "4rem" }}>{value}rem</span>
          <div
            style={{
              inlineSize: `${value}rem`,
              blockSize: "1rem",
              background: "currentColor",
              opacity: 0.35,
            }}
          />
        </div>
      ))}
    </div>
  ),
};
