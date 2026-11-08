import type { Meta, SampleOf } from "../catalog/types";
import { AdminSample } from "./admin-sample";

/**
 * 사용자 관리: 표가 주인공인 화면. 이름·이메일·역할·상태가 있는 사람 목록에서 검색·필터·정렬하고, 여러 행을 골라
 * 한꺼번에 바꾸거나, 초대처럼 여러 값을 받는 대화상자를 여는 화면을 만들 때 본뜬다. 휴대폰은 표 대신 행 목록이 된다.
 */
const meta = {
  title: "Playground (플레이그라운드)/사용자 관리", id: "playground-users", component: AdminSample,
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta<typeof AdminSample>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Table: Sample = { name: "사용자 표", args: { initialPath: "/users" } };
export const Selected: Sample = { name: "고른 행과 일괄 동작", args: { initialPath: "/users", preset: { selectedUsers: ["u-jiwoo", "u-dohyun", "u-minjun"] } } };
export const Invite: Sample = { name: "초대 대화상자", args: { initialPath: "/users?invite=true" } };
