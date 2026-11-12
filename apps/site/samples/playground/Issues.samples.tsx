import type { Meta, SampleOf } from "../catalog/types";
import { IssuesApp } from "./issues/app/IssuesApp";

/**
 * 이슈 앱: 업무를 추적하는 기능(이슈·티켓·할 일)을 만들 때 본뜬다. 같은 조회를 행 목록과 상태별 보드로 보는 표시 전환, 검색·필터,
 * 목록 위 대화상자로 만들기와 크게 보기, 속성 알약 열이 있는 상세, 행 끝 버튼·Space의 미리보기가 한 앱에 있다.
 */
const meta = {
  title: "Playground (플레이그라운드)/이슈", id: "playground-issues", component: IssuesApp,
  layout: "fullscreen", height: "40rem", device: "desktop", kit: "shadcn",
} satisfies Meta<typeof IssuesApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const List: Sample = { name: "행 목록", args: { initialPath: "/issues" } };
export const Board: Sample = { name: "보드", args: { initialPath: "/issues?layout=board" } };
export const ComposeOverList: Sample = { name: "목록 위 만들기", args: { initialPath: "/issues?panel=%2Fissues%2Fnew" } };
export const Detail: Sample = { name: "상세", args: { initialPath: "/issues/ISS-12" } };
