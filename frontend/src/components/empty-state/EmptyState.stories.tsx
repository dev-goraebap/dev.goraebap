import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";
const meta = {
  title: "컴포넌트/빈 상태",
  component: EmptyState,
  args: {
    title: "아직 자료가 없습니다",
    description: "첫 자료를 추가해 보세요.",
  },
  decorators: [
    (Story) => (
      <div
        style={{ height: "75dvh", display: "flex", flexDirection: "column" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = { name: "자료 없음" };
export const Search: Story = {
  name: "검색 결과 없음",
  args: {
    kind: "search",
    title: "검색 결과가 없습니다",
    description: "검색어와 필터를 바꿔 보세요.",
  },
};
export const Error: Story = {
  name: "조회 실패",
  args: {
    kind: "error",
    title: "자료를 불러오지 못했습니다",
    description: "잠시 후 다시 시도해 주세요.",
    action: "다시 시도",
    onAction: () => {},
  },
};
export const Missing: Story = {
  name: "찾을 수 없음",
  args: {
    kind: "not-found",
    title: "자료를 찾을 수 없습니다",
    description: "목록에서 다른 자료를 찾아보세요.",
  },
};
