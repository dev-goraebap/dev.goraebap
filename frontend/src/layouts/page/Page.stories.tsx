import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageLayout, PageNotice } from "./PageLayout";
import { Icon } from "../../foundations/Icon";
const meta = {
  title: "레이아웃/페이지 영역",
  component: PageLayout,
  args: {
    title: "자료",
    icon: <Icon name="library" />,
    children: <div style={{ padding: "1rem" }}>콘텐츠</div>,
  },
  decorators: [
    (Story) => (
      <div style={{ height: "90dvh", display: "flex" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Basic: Story = { name: "기본 헤더와 본문" };
export const Notice: Story = {
  name: "헤더 아래 안내",
  args: {
    notice: (
      <PageNotice>
        자료를 새로 불러오지 못했습니다. 이전 내용을 표시합니다.
      </PageNotice>
    ),
  },
};
