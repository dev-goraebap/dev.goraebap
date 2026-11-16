import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta from "./Inbox.samples";

type Sample = SampleOf<typeof meta>;

const VerifyPane: Sample = {
  name: "고르기·읽음·닫기 검증",
  args: { initialPath: "/inbox" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    // 고른 것이 없으면 오른쪽 칸은 고르기를 권하는 그림과 제목이다.
    await waitFor(() => expect(page.getByText("알림을 선택해 주세요")).toBeVisible());
    // 줄의 링크가 줄 전체를 덮어 글자가 아닌 곳(미리 보는 글)을 눌러도 열린다. 열면 읽음이 된다.
    await waitFor(() => expect(page.getAllByText("안 읽음")).toHaveLength(4));
    const excerpt = page.getAllByText("11월 셋째 주부터 예고 글을 내보내고, 둘째 주에 마감합니다.")[0].getBoundingClientRect();
    const hit = canvasElement.ownerDocument.elementFromPoint(excerpt.left + excerpt.width / 2, excerpt.top + excerpt.height / 2);
    await expect(hit?.closest("a")).toHaveAccessibleName(/가을 캠페인 일정/);
    await userEvent.click(hit!.closest("a")!);
    const pane = await page.findByRole("region", { name: "고른 항목" });
    await expect(await within(pane).findByRole("button", { name: "보관하기" })).toBeVisible();
    await waitFor(() => expect(page.getByRole("list", { name: "받은 알림, 안 읽음 3개" })).toBeInTheDocument());
    // 다른 줄을 누르면 칸이 그 알림으로 바뀐다.
    await userEvent.click(page.getAllByRole("link", { name: /가입 흐름 점검/ })[0]);
    await expect(await within(pane).findByRole("heading", { name: /^도현님이 "가입 흐름 점검"/ })).toBeInTheDocument();
    // ←로 닫으면 다시 고르기를 권하는 칸이다.
    await userEvent.click(within(pane).getByRole("button", { name: "고른 항목 닫기" }));
    await waitFor(() => expect(page.getByText("알림을 선택해 주세요")).toBeVisible());
  },
};

const VerifyArchive: Sample = {
  name: "보관하기와 보관함 검증",
  args: { initialPath: "/inbox/n2" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const pane = await page.findByRole("region", { name: "고른 항목" });
    await userEvent.click(await within(pane).findByRole("button", { name: "보관하기" }));
    await waitFor(() => expect(page.queryByRole("link", { name: /가입 흐름 점검/ })).not.toBeInTheDocument());
    await waitFor(() => expect(page.getByText("알림을 선택해 주세요")).toBeVisible());
    await userEvent.click(page.getByRole("link", { name: "보관함" }));
    await expect(await page.findByRole("link", { name: /가입 흐름 점검/ })).toBeVisible();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 인박스는 알림 페이지로 검증",
  args: { initialPath: "/inbox" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("list", { name: /받은 알림/ });
    await expect(page.queryByText("알림을 선택해 주세요")).toBeNull();
    await userEvent.click(page.getAllByRole("link", { name: /가을 캠페인 일정/ })[0]);
    await expect(await page.findByRole("heading", { level: 1, name: /가을 캠페인 일정/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "보관하기" })).toBeVisible();
  },
};

test(VerifyPane.name, () => runSample(meta, VerifyPane));
test(VerifyArchive.name, () => runSample(meta, VerifyArchive));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone, "phone"));
