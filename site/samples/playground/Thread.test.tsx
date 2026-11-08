import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import type { Message } from "./thread/entities/thread";
import { ThreadApp } from "./thread/app/ThreadApp";
import { createThreadApi } from "./thread/mocks/thread-api";
import meta from "./Thread.samples";

type Sample = SampleOf<typeof meta>;

const scrollerOf = (element: HTMLElement) => {
  for (let node = element.parentElement; node; node = node.parentElement) if (/auto|scroll/.test(getComputedStyle(node).overflowY)) return node;
  throw new Error("스크롤 칸을 찾을 수 없습니다.");
};

const VerifySend: Sample = {
  name: "보내기·묶음·멘션·실패 다시 보내기 검증",
  args: { initialPath: "/rooms/design", initialOutbox: { design: [{ localId: "failed-1", body: "수정본은 오후 네 시까지 올리겠습니다.", status: "failed" }] } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const log = await page.findByRole("log", { name: "대화" });
    // 날짜 구분과 같은 사람의 묶음: 도현의 두 메시지는 이름을 한 번만 보인다.
    await expect(within(log).getByText("어제")).toBeVisible();
    const first = within(log).getByText("아침에 확인해 보니 키보드로 스위치를 옮기는 순서가 어긋나 있었습니다.");
    const second = within(log).getByText("@서윤", { exact: false });
    await expect(second.closest("p")?.parentElement).toBe(first.parentElement);
    // 처음 열면 맨 아래에서 시작한다.
    const scroller = scrollerOf(log);
    await waitFor(() => expect(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight).toBeLessThan(4));
    // 실패한 메시지는 곁에서 다시 보낸다.
    await expect(within(log).getByText("보내지 못했습니다")).toBeVisible();
    await userEvent.click(within(log).getByRole("button", { name: "다시 보내기" }));
    await waitFor(() => expect(within(log).queryByText("보내지 못했습니다")).not.toBeInTheDocument());
    await expect(await within(log).findByText("수정본은 오후 네 시까지 올리겠습니다.")).toBeVisible();
    // @를 치면 방 사람을 고른다.
    const input = page.getByRole("combobox", { name: "메시지" });
    await userEvent.click(input);
    await userEvent.type(input, "@지");
    await userEvent.click(await page.findByRole("option", { name: /지우/ }));
    await expect(input).toHaveTextContent("@지우");
    await userEvent.type(input, "시안 확인했어요");
    await userEvent.click(page.getByRole("button", { name: "보내기" }));
    await expect(input).toHaveTextContent("");
    await expect(await within(log).findByText("시안 확인했어요", { exact: false })).toBeVisible();
    // 내가 보낸 글이면 아래로 따라간다.
    await waitFor(() => expect(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight).toBeLessThan(4));
  },
};

const VerifySendFailure: Sample = {
  name: "보내기가 실패하면 다시 보내기 검증",
  args: { initialPath: "/rooms/release" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(await page.findByText("아직 대화가 없습니다")).toBeInTheDocument();
    const input = page.getByRole("combobox", { name: "메시지" });
    await userEvent.type(input, "실패하는 메시지");
    await userEvent.keyboard("{Enter}");
    const log = await page.findByRole("log", { name: "대화" });
    await expect(await within(log).findByText("보내지 못했습니다")).toBeVisible();
    await userEvent.click(within(log).getByRole("button", { name: "다시 보내기" }));
    await waitFor(() => expect(within(log).queryByText("보내지 못했습니다")).not.toBeInTheDocument());
    await expect(within(log).getByText("실패하는 메시지")).toBeVisible();
  },
};

const many: Message[] = Array.from({ length: 40 }, (_, index) => ({
  id: `x${index}`, roomId: "design", author: index % 2 ? "지우" : "도현", sentAt: `2026-11-07T${String(1 + Math.floor(index / 3)).padStart(2, "0")}:${String((index % 3) * 10).padStart(2, "0")}:00Z`,
  body: `이어지는 긴 대화의 ${index + 1}번째 메시지입니다.`,
}));
const VerifyIncoming: Sample = {
  name: "위로 올라가 읽는 중 새 글 알림 검증",
  render: () => <ThreadApp initialPath="/rooms/design" api={createThreadApi({ delay: 20, incomingAfter: 200, messages: many })} />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const log = await page.findByRole("log", { name: "대화" });
    const scroller = scrollerOf(log);
    await waitFor(() => expect(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight).toBeLessThan(4));
    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event("scroll"));
    const jump = await page.findByRole("button", { name: "새 글 1개, 아래로" }, { timeout: 6000 });
    // 읽던 자리는 지킨다.
    await expect(scroller.scrollTop).toBeLessThan(100);
    await userEvent.click(jump);
    await waitFor(() => expect(page.queryByRole("button", { name: /새 글/ })).not.toBeInTheDocument());
    await waitFor(() => expect(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight).toBeLessThan(4), { timeout: 3000 });
    await expect(within(log).getByText("확인했습니다. 점검 결과를 정리해서 이어서 올리겠습니다.")).toBeVisible();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 대화는 전체 화면이고 입력 칸이 바닥에 붙음 검증",
  args: { initialPath: "/rooms/design" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const input = await page.findByRole("combobox", { name: "메시지" });
    await waitFor(() => expect(page.queryByRole("navigation", { name: "주 메뉴" })).not.toBeInTheDocument());
    const box = input.getBoundingClientRect();
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(window.innerHeight - box.bottom).toBeLessThan(100);
    await expect(parseFloat(getComputedStyle(input).fontSize)).toBeGreaterThanOrEqual(16);
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    await userEvent.type(input, "휴대폰에서 보냅니다");
    await userEvent.click(page.getByRole("button", { name: "보내기" }));
    await expect(await page.findByText("휴대폰에서 보냅니다")).toBeVisible();
  },
};

test(VerifySend.name, () => runSample(meta, VerifySend), 20000);
test(VerifySendFailure.name, () => runSample(meta, VerifySendFailure), 20000);
test(VerifyIncoming.name, () => runSample(meta, VerifyIncoming), 20000);
test(VerifyPhone.name, () => runSample(meta, VerifyPhone, "phone"), 20000);
