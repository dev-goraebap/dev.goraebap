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

test(VerifyDiscard.name, () => runSample(meta, VerifyDiscard));
