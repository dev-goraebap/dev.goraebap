import { test } from "vitest";
import { LibraryApp } from "./library/app/LibraryApp";
import { createResourceApi } from "./library/mocks/resource-api";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Peek.samples";

type Sample = SampleOf<typeof meta>;
const VerifyPeek: Sample = {
  name: "열기·옮기기·닫기 검증",
  args: { initialPath: "/resources" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "기다리는 시간을 설계하는 방법 미리보기" }));
    const panel = await page.findByRole("complementary", { name: "미리보기: 기다리는 시간을 설계하는 방법" });
    await expect(within(panel).getByRole("heading", { level: 2, name: "기다리는 시간을 설계하는 방법" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "모든 자료" })).toBeInTheDocument();
    const row = page.getAllByRole("link", { name: /기다리는 시간을 설계하는 방법/ })[0];
    row.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(page.getByRole("complementary", { name: /^미리보기: / })).not.toHaveAccessibleName("미리보기: 기다리는 시간을 설계하는 방법"));
    // 열린 툴팁은 맨 위 레이어라 첫 Esc를 먼저 가져간다. 포인터를 치워 툴팁이 없는 상태에서 누른다.
    await userEvent.unhover(page.getByRole("button", { name: "기다리는 시간을 설계하는 방법 미리보기" }));
    await waitFor(() => expect(page.queryByRole("tooltip")).not.toBeInTheDocument());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("complementary", { name: /^미리보기: / })).not.toBeInTheDocument());
    await userEvent.keyboard(" ");
    await expect(await page.findByRole("complementary", { name: /^미리보기: / })).toBeVisible();
  },
};

const VerifyInbox: Sample = {
  name: "받은 요청 고르기·닫기·다시 고르기 검증",
  args: { initialPath: "/requests" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    // 고른 것이 없으면 상세 칸은 고르라는 안내다.
    await waitFor(() => expect(page.getByText("요청을 선택해 주세요")).toBeVisible());
    // 행의 글자가 아닌 곳(설명)을 눌러도 상세 칸에 열린다.
    await userEvent.click(page.getByText("대기 화면 문구를 한 번 봐 주세요."));
    await expect(await page.findByRole("complementary", { name: "미리보기: 지우 · 검토 요청" })).toBeVisible();
    // ←로 닫으면 다시 안내가 보이고, 다른 행을 누르면 다시 열린다.
    await userEvent.click(page.getByRole("button", { name: "고른 항목 닫기" }));
    await waitFor(() => expect(page.getByText("요청을 선택해 주세요")).toBeVisible());
    await userEvent.click(page.getByText("주소 규칙을 정리할 때 참고하면 좋겠습니다."));
    await expect(await page.findByRole("complementary", { name: "미리보기: 도현 · 공유" })).toBeVisible();
    // 위·아래 키로 옮기면 상세 칸이 따라간다.
    page.getAllByRole("link", { name: /도현님의 공유/ })[0].focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(await page.findByRole("complementary", { name: "미리보기: 서윤 · 댓글" })).toBeVisible();
    // Esc로 닫으면 안내로 돌아간다.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.getByText("요청을 선택해 주세요")).toBeVisible());
  },
};

test(VerifyPeek.name, () => runSample(meta, VerifyPeek));
const VerifyInboxPhone: Sample = {
  name: "휴대폰 받은 요청은 자료 페이지로 검증",
  args: { initialPath: "/requests" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.queryByText("요청을 선택해 주세요")).toBeNull();
    await userEvent.click((await page.findAllByText("대기 화면 문구를 한 번 봐 주세요."))[0]);
    await expect(await page.findByRole("heading", { level: 1, name: "기다리는 시간을 설계하는 방법" })).toBeVisible();
  },
};

test(VerifyInbox.name, () => runSample(meta, VerifyInbox));
test(VerifyInboxPhone.name, () => runSample(meta, VerifyInboxPhone, "phone"));
