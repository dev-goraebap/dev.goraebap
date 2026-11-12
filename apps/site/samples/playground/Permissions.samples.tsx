import type { Meta, SampleOf } from "../catalog/types";
import { AdminSample } from "./admin-sample";

/**
 * 권한 설정: 역할 하나를 고르는 기능별 토글 카드. 여러 칸을 바꿔 두었다가 한 번에 저장하는 화면, 저장하지 않은 변경을 표시하고 떠날 때
 * 묻는 화면, 바꿀 수 없는 칸에 이유를 알리는 화면을 만들 때 본뜬다. 휴대폰은 역할 하나를 골라 기능 스위치 목록으로 본다.
 */
const meta = {
  title: "Playground (플레이그라운드)/권한 설정", id: "playground-permissions", component: AdminSample,
  layout: "fullscreen", height: "44rem", device: "desktop", kit: "shadcn",
} satisfies Meta<typeof AdminSample>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Grid: Sample = { name: "역할별 권한", args: { initialPath: "/permissions" } };
export const Changed: Sample = { name: "바꾼 상태", args: { initialPath: "/permissions", preset: { changedCells: ["editor:docs.delete", "writer:issues.assign", "viewer:docs.write"], permissionRole: "writer" } } };
