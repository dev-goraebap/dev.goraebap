import type { Meta, SampleOf } from "../catalog/types";
import { LibraryApp } from "../playground/library/app/LibraryApp";
import { createResourceApi } from "../playground/library/mocks/resource-api";

/** 실제 라우터와 서가 화면을 메모리 히스토리로 실행한다. 브라우저 주소·새로고침은 제품 URL에서 따로 확인한다. */
const meta = {
  title: "Patterns (사용 패턴)/라우트 마스킹", id: "patterns-route-masking", component: LibraryApp,
  layout: "fullscreen", height: "38rem",
  device: "desktop",
  render: args => <LibraryApp {...args} api={createResourceApi({ delay: 30 })} />,
} satisfies Meta<typeof LibraryApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const OverList: Sample = { name: "목록 위에서 열기", args: { initialPath: "/resources?panel=/resources/new" } };
export const DirectEntry: Sample = { name: "직접 진입", args: { initialPath: "/resources/new" } };

