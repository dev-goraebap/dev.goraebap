import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Dialog.samples";

type Sample = SampleOf<typeof meta>;
const VerifyFocus: Sample = {
  name: "닫기와 초점 복귀 검증",
  render: () => <samples.Basic isLong />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const opener = page.getByRole("button", { name: "대화상자 열기" });
    await userEvent.click(opener);
    const dialog = await page.findByRole("dialog", { name: "자료 정리 기준" });
    await waitFor(() => expect(within(dialog).getByRole("heading", { name: "자료 정리 기준" })).toHaveFocus());
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "확인" })).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.click(opener);
    await userEvent.click(await page.findByRole("button", { name: "닫기" }));
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

const VerifyAlert: Sample = {
  name: "확인 창 초점 검증",
  render: () => <samples.Confirm />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "자료 삭제" }));
    await page.findByRole("alertdialog");
    await waitFor(() => expect(page.getByRole("button", { name: "취소" })).toHaveFocus());
    await expect(page.queryByRole("button", { name: "닫기" })).not.toBeInTheDocument();
  },
};

const VerifyForm: Sample = {
  name: "짧은 양식의 빠진 칸 검증",
  render: () => samples.Form.render!({} as never),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "이름 바꾸기" }));
    const name = await page.findByRole("textbox", { name: "이름" });
    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.clear(name);
    // 제출은 막지 않는다. 누르면 빠진 칸에 표시와 설명을 붙이고 그 칸으로 초점을 옮긴다.
    await userEvent.click(page.getByRole("button", { name: "바꾸기" }));
    await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"));
    await expect(page.getByRole("alert")).toHaveTextContent("이름을 입력해 주세요.");
    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.type(name, "읽을거리{Enter}");
    await waitFor(() => expect(page.queryByRole("textbox", { name: "이름" })).not.toBeInTheDocument());
  },
};

test(VerifyFocus.name, () => runSample(meta, VerifyFocus));
test(VerifyForm.name, () => runSample(meta, VerifyForm));
test(`${VerifyForm.name} · 휴대폰 바텀시트`, () => runSample(meta, VerifyForm, "phone"));
test(VerifyAlert.name, () => runSample(meta, VerifyAlert));
