import type { Meta, SampleOf } from "../catalog/types";
import { LibraryApp } from "../playground/library/app/LibraryApp";
import { createResourceApi } from "../playground/library/mocks/resource-api";

const meta = {
  title: "Patterns (사용 패턴)/입력과 상호작용", id: "patterns-interaction", component: LibraryApp,
  layout: "fullscreen", height: "34rem",
  device: "desktop", kit: "shadcn",
  render: args => <LibraryApp {...args} api={createResourceApi({ delay: 0 })} />,
} satisfies Meta<typeof LibraryApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Rows: Sample = { name: "행 전체와 안의 동작", args: { initialPath: "/resources" } };

