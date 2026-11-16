import type { Meta, SampleOf } from "../catalog/types";
import { ThreadApp } from "./thread/app/ThreadApp";

/**
 * 댓글·대화. 메시지가 아래로 쌓이고 입력 칸이 바닥에 붙는 화면(채팅, 댓글 스레드, 문의 응대)을 만들 때 본뜬다. 날짜 구분과
 * 같은 사람의 묶음, @멘션, 보내는 중·실패, 새 글 알림을 다루고 휴대폰은 전체 화면에서 입력 칸이 키보드와 홈 표시줄을 피한다.
 */
const meta = {
  title: "Playground (플레이그라운드)/댓글·대화", id: "playground-thread", component: ThreadApp,
  layout: "fullscreen", height: "38rem",
  device: "desktop",
} satisfies Meta<typeof ThreadApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

/** 보내지 못한 메시지 하나와, 잠시 뒤 오는 새 글 한 건이 있는 대화방. */
export const Room: Sample = {
  name: "대화방",
  args: {
    initialPath: "/rooms/design", incomingAfter: 9000,
    initialOutbox: { design: [{ localId: "failed-1", body: "수정본은 오후 네 시까지 올리겠습니다.", status: "failed" }] },
  },
};
export const Empty: Sample = { name: "빈 대화", args: { initialPath: "/rooms/release" } };
