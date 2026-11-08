import type { Meta, SampleOf } from "../catalog/types";
import { LibraryApp } from "./library/app/LibraryApp";
import { createResourceApi } from "./library/mocks/resource-api";

/**
 * 목록 + 미리보기. 처리 목록(받은 요청)은 목록과 상세 칸을 함께 두고 행 어디를 눌러도 상세 칸에 연다. 고른 것이 없으면 상세 칸은
 * 고르라는 빈 상태다. 작업 목록(서가)은 행 클릭이 페이지이고 미리보기는 행 끝 버튼과 Space로 연다. 메모리 히스토리로 같은 훅을 실행한다.
 */
const meta = {
  title: "Playground (플레이그라운드)/목록 + 미리보기", id: "playground-peek", component: LibraryApp,
  layout: "fullscreen", height: "38rem",
  device: "desktop",
  render: args => <LibraryApp {...args} api={createResourceApi({ delay: 0 })} />,
} satisfies Meta<typeof LibraryApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Inbox: Sample = { name: "받은 요청", args: { initialPath: "/requests" } };
export const InboxOpen: Sample = { name: "받은 요청 열림", args: { initialPath: "/requests?peek=r1" } };
export const Open: Sample = { name: "작업 목록 미리보기", args: { initialPath: "/resources?peek=router" } };
export const Missing: Sample = { name: "없는 대상", args: { initialPath: "/requests?peek=unknown" } };

