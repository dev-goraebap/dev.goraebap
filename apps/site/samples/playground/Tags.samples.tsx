import type { Meta, SampleOf } from "../catalog/types";
import { AdminSample } from "./admin-sample";

/**
 * 태그 관리: 짧은 목록과 짧은 양식. 이름 하나와 색 하나를 다루는 관리 화면(분류·라벨·카테고리)이나, 지울 때 쓰인 곳의
 * 수를 밝혀 확인받는 화면을 만들 때 본뜬다.
 */
const meta = {
  title: "Playground (플레이그라운드)/태그 관리", id: "playground-tags", component: AdminSample,
  layout: "fullscreen", height: "40rem", device: "desktop", kit: "shadcn",
} satisfies Meta<typeof AdminSample>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const List: Sample = { name: "태그 목록", args: { initialPath: "/tags" } };
export const Rename: Sample = { name: "이름 바꾸기 대화상자", args: { initialPath: "/tags?edit=tag-design" } };
