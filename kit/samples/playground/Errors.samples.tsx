import type { Meta, SampleOf } from "../catalog/types";
import { ErrorsApp } from "./errors/app/ErrorsApp";

/**
 * 막힌 상태를 만들 때 본뜬다. 없는 페이지와 권한 없음은 셸을 두고 본문만 상태 화면으로 바꾸고, 점검 중은 셸 없이 전체 화면에
 * 둔다. 세션 만료는 화면을 떠나지 않고 위에 다시 로그인 대화상자를 열어, 로그인하면 쓰던 내용 그대로 이어 간다.
 */
const meta = {
  title: "Playground (플레이그라운드)/오류·권한 페이지", id: "playground-errors", component: ErrorsApp,
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta<typeof ErrorsApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Missing: Sample = { name: "없는 페이지", args: { initialPath: "/archive/2024" } };
export const Restricted: Sample = { name: "권한 없음", args: { initialPath: "/docs/plan" } };
export const Maintenance: Sample = { name: "점검 중", args: { initialPath: "/maintenance" } };
export const SessionEnded: Sample = { name: "세션 만료", args: { initialPath: "/notes/new", isExpired: true } };
