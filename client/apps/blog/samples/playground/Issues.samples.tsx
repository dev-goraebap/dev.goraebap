import type { Meta, SampleOf } from "../catalog/types";
import { IssuesApp } from "./issues/app/IssuesApp";

/**
 * 이슈 앱: 업무를 추적하는 기능(이슈·티켓·할 일)을 만들 때 본뜬다. 페이지 이동형(Drill-down): 목록은 전체 너비이고 상세 ·
 * 작성 · 수정은 각자 자기 페이지다. 같은 조회를 행 목록과 상태별 보드로 보는 표시 전환, 검색·필터, 속성 알약 열이 있는 상세가 한 앱에 있다.
 */
const meta = {
  title: "Playground (플레이그라운드)/이슈", id: "playground-issues", component: IssuesApp,
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta<typeof IssuesApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const List: Sample = { name: "행 목록", args: { initialPath: "/issues" } };
export const Board: Sample = { name: "보드", args: { initialPath: "/issues?layout=board" } };
export const ComposePage: Sample = { name: "작성 페이지", args: { initialPath: "/issues/new" } };
export const Detail: Sample = { name: "상세", args: { initialPath: "/issues/ISS-12" } };
