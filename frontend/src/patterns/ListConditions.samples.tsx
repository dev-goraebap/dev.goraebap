import type { Meta, SampleOf } from "../catalog/types";
import { LibrarySample } from "../playground/library-sample";

/** 목록 조건: 검색어·필터·표시는 주소가 가진다. 적용 줄과 도구의 표시 점이 지금 조건을 보이고, 같은 주소로 다시 열면 같은 목록이다. */
const meta = {
  title: "Patterns (사용 패턴)/목록 조건", id: "patterns-list-conditions", component: LibrarySample,
  layout: "fullscreen", height: "36rem", device: "desktop",
} satisfies Meta<typeof LibrarySample>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Filtered: Sample = { name: "필터 적용", args: { initialPath: "/resources?author=서윤&kind=document" } };
export const Searched: Sample = { name: "검색어", args: { initialPath: "/resources?q=주소" } };
