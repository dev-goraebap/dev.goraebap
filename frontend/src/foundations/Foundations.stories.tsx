import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "./Icon";

const meta = {
  title: "기초/테마와 아이콘",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Surfaces: Story = {
  name: "면과 구분선",
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: "40rem" }}>
      <div
        style={{
          padding: "1rem",
          background: "var(--color-background-body)",
          border: "1px solid var(--color-border)",
        }}
      >
        앱 배경과 경계
      </div>
      <div className="resource-item" style={{ padding: "1rem" }}>
        콘텐츠 면과 내부 구분선
      </div>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          color: "var(--color-text-primary)",
        }}
      >
        <span>주요 정보</span>
        <span style={{ color: "var(--color-text-secondary)" }}>보조 정보</span>
      </div>
    </div>
  ),
};
export const Icons: Story = {
  name: "기본·선택 아이콘",
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
      {(
        ["library", "folder", "document", "link", "image", "star"] as const
      ).map((name) => (
        <div
          key={name}
          style={{
            display: "flex",
            gap: ".75rem",
            padding: "1rem",
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
export const Actions: Story = {
  name: "버튼 역할과 크기",
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Button label="자료 추가" variant="create" icon={<Icon name="plus" />} />
      <Button label="만들기" variant="primary" />
      <Button label="취소" variant="ghost" />
      <Button
        label="검색"
        isIconOnly
        variant="tool"
        icon={<Icon name="search" />}
      />
      <Button
        label="문서"
        variant="view-active"
        icon={<Icon name="document" selected />}
      />
    </div>
  ),
};
