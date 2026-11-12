import { test } from "vitest";
import { LibraryApp } from "../playground/library/app/LibraryApp";
import { createResourceApi } from "../playground/library/mocks/resource-api";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./RouteMasking.samples";

type Sample = SampleOf<typeof meta>;
const VerifyExpand: Sample = {
  name: "초안 보존·크게 보기·닫기 검증",
  args: { initialPath: "/resources?q=기준" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "자료 추가" }));
    const dialog = await page.findByRole("dialog", { name: "새 자료" });
    await userEvent.type(within(dialog).getByRole("textbox", { name: "제목" }), "접근성 검토 기록");
    await userEvent.click(within(dialog).getByRole("button", { name: "크게 보기" }));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(await page.findByRole("textbox", { name: "제목" })).toHaveValue("접근성 검토 기록");
    // 고친 것이 있으면 취소가 버릴지 먼저 묻는다.
    await userEvent.click(page.getByRole("button", { name: "취소" }));
    const confirm = await page.findByRole("alertdialog", { name: "작성 중인 내용을 버릴까요?" });
    await userEvent.click(within(confirm).getByRole("button", { name: "버리기" }));
    await expect(await page.findByRole("list", { name: "자료" })).toBeInTheDocument();
  },
};

const VerifyClose: Sample = {
  name: "닫으면 목록 조건 복원 검증",
  args: { initialPath: "/resources?q=주소" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("link", { name: /주소에 남겨야 하는 화면 상태/ });
    await userEvent.click(page.getByRole("button", { name: "자료 추가" }));
    await page.findByRole("dialog", { name: "새 자료" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    // 닫으면 연 기록을 되돌려 목록 조건(?q=주소)이 그대로다. 찾는 말이 걸려 있으면 찾기 도구에 점이 있고, 열면 그 말이 칸에 있다.
    await expect(await page.findByRole("link", { name: /주소에 남겨야 하는 화면 상태/ })).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "자료 검색, 찾는 중" }));
    await expect(await page.findByRole("searchbox", { name: "자료 검색" })).toHaveValue("주소");
  },
};

test(VerifyExpand.name, () => runSample(meta, VerifyExpand));
test(VerifyClose.name, () => runSample(meta, VerifyClose));
