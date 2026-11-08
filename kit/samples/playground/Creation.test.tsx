import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Creation.samples";

type Sample = SampleOf<typeof meta>;
const VerifyDiscard: Sample = {
  name: "닫기 확인·크게 보기 검증",
  render: () => <samples.Composer />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "항목 추가" }));
    const title = await page.findByRole("textbox", { name: "제목" });
    await waitFor(() => expect(title).toHaveFocus());
    await userEvent.type(title, "남길 초안");
    await userEvent.keyboard("{Escape}");
    await page.findByRole("alertdialog", { name: "작성 중인 내용을 버릴까요?" });
    await userEvent.click(page.getByRole("button", { name: "계속 작성" }));
    await expect(page.getByRole("textbox", { name: "제목" })).toHaveValue("남길 초안");
    await userEvent.click(page.getByRole("button", { name: "만들기" }));
    await expect(await page.findByText("모음을 정해 주세요.")).toBeVisible();
    await waitFor(() => expect(page.getByRole("button", { name: "모음 (필수)" })).toHaveFocus());
    await userEvent.click(page.getByRole("button", { name: "모음 (필수)" }));
    await userEvent.click(await page.findByRole("option", { name: "개발 자료" }));
    await userEvent.click(page.getByRole("button", { name: "크게 보기" }));
    await expect(await page.findByRole("textbox", { name: "제목" })).toHaveValue("남길 초안");
    await expect(page.queryByText("모음을 정해 주세요.")).not.toBeInTheDocument();
  },
};

const VerifyPageFoot: Sample = {
  name: "작성 페이지 바닥 고정·동작만 검증",
  render: () => <samples.Composer startOpen />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "크게 보기" }));
    const submit = await page.findByRole("button", { name: "만들기" });
    // 동작은 본문 아래가 아니라 화면 바닥에 붙은 줄에 있고, 줄에는 버튼만 있다.
    const bar = submit.closest("[class*='foot']") as HTMLElement;
    await expect(bar).not.toBeNull();
    await expect(within(bar).getByRole("button", { name: "취소" })).toBeVisible();
    // 줄은 스크롤되는 본문 밖(페이지 바닥)에 있어 본문을 내려도 늘 보인다.
    let scroller = page.getByRole("textbox", { name: "제목" }).parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    await expect(scroller).not.toBeNull();
    await expect(scroller!.contains(bar)).toBe(false);
    await expect([...bar.querySelectorAll("button")].map(each => each.textContent?.trim())).toEqual(["취소", "만들기"]);
    // 빠진 값 안내는 칸 곁에 보이고 바닥 줄에는 들어가지 않는다.
    await userEvent.click(submit);
    const hint = await page.findByText("모음을 정해 주세요.");
    await expect(bar.contains(hint)).toBe(false);
  },
};

test(VerifyDiscard.name, () => runSample(meta, VerifyDiscard));
test(VerifyPageFoot.name, () => runSample(meta, VerifyPageFoot));
