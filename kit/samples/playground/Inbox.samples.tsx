import type { Meta, SampleOf } from "../catalog/types";
import { InboxApp } from "./inbox/app/InboxApp";

/**
 * 인박스. 알림·받은 요청·승인 대기처럼 하나씩 열어 확인하고 처리하며 넘어가는 목록을 만들 때 본뜬다. 목록 옆에 상세 칸이
 * 늘 있고, 고르기 전에는 고르라는 빈 상태이며, 행 어디를 눌러도 그 칸에 열린다. 휴대폰은 목록만 보이고 항목은 페이지로 연다.
 */
const meta = {
  title: "Playground (플레이그라운드)/인박스", id: "playground-inbox", component: InboxApp,
  layout: "fullscreen", height: "38rem",
  device: "desktop",
} satisfies Meta<typeof InboxApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Idle: Sample = { name: "고르기 전", args: { initialPath: "/inbox" } };
export const Opened: Sample = { name: "하나 연 상태", args: { initialPath: "/inbox?peek=n1" } };
export const Empty: Sample = { name: "빈 인박스", args: { initialPath: "/inbox", notifications: [] } };
