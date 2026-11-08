import type { Meta, SampleOf } from "../catalog/types";
import { LibrarySample } from "./library-sample";

/** 목록 템플릿: 같은 데이터를 행·문서 카드·표로 보이고, 검색·필터·표시는 주소가 가진다. */
const meta = {
  title: "Playground (플레이그라운드)/목록", id: "playground-list", component: LibrarySample,
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta<typeof LibrarySample>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Library: Sample = { name: "행 목록", args: { initialPath: "/resources" } };
export const Grid: Sample = { name: "문서 카드", args: { initialPath: "/resources?layout=grid" } };
export const Table: Sample = { name: "표", args: { initialPath: "/resources?layout=table" } };
export const TableGrouped: Sample = { name: "표와 그룹", args: { initialPath: "/resources?layout=table&group=collection" } };
export const Collection: Sample = { name: "컬렉션", args: { initialPath: "/resources?collection=design" } };
export const Split: Sample = { name: "Split 배치", args: { initialPath: "/resources", initialLayout: "split" } };
