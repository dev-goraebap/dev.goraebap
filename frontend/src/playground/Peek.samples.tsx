import type { Meta, SampleOf } from "../catalog/types";
import { LibraryApp } from "./library/app/LibraryApp";
import { createResourceApi } from "./library/mocks/resource-api";

/** 서가는 작업 목록이다: 행 클릭은 페이지, 미리보기는 행 끝 버튼과 Space. 메모리 히스토리로 같은 훅을 실행한다. */
const meta = {
  title: "Playground (플레이그라운드)/목록 + 미리보기", id: "playground-peek", component: LibraryApp,
  layout: "fullscreen", height: "38rem",
  device: "desktop",
  render: args => <LibraryApp {...args} api={createResourceApi({ delay: 0 })} />,
} satisfies Meta<typeof LibraryApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Open: Sample = { name: "목록 옆 미리보기", args: { initialPath: "/resources?peek=router" } };
export const Missing: Sample = { name: "없는 대상", args: { initialPath: "/resources?peek=unknown" } };
export const Phone: Sample = { name: "휴대폰은 페이지로", args: { initialPath: "/resources?peek=router" }, device: "phone" };

