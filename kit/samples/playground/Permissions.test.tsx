import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta from "./Permissions.samples";

type Sample = SampleOf<typeof meta>;

const VerifySave: Sample = {
  name: "칸을 바꾸면 저장 줄이 나타나고 저장하면 사라진다",
  args: { initialPath: "/permissions" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const cell = await page.findByRole("checkbox", { name: "작성자 문서 삭제" });
    await expect(page.queryByRole("region", { name: "변경 사항 저장" })).not.toBeInTheDocument();
    await userEvent.click(cell);
    const bar = await page.findByRole("region", { name: "변경 사항 저장" });
    await expect(within(bar).getByRole("button", { name: "변경 1개 저장" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "작성자 문서 삭제, 바뀜" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "관리자 문서 삭제" })).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(within(bar).getByRole("button", { name: "변경 1개 저장" }));
    await waitFor(() => expect(page.queryByRole("region", { name: "변경 사항 저장" })).not.toBeInTheDocument());
    await expect(page.getByRole("checkbox", { name: "작성자 문서 삭제" })).toBeChecked();
  },
};

const VerifyLeave: Sample = {
  name: "바꾼 칸이 있으면 떠나기 전에 묻는다",
  args: { initialPath: "/permissions" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("checkbox", { name: "열람자 문서 작성" }));
    await userEvent.click(page.getByRole("link", { name: "태그" }));
    const alert = await page.findByRole("alertdialog", { name: "저장하지 않고 나갈까요?" });
    await userEvent.click(within(alert).getByRole("button", { name: "계속 편집" }));
    await waitFor(() => expect(page.queryByRole("alertdialog")).not.toBeInTheDocument());
    await expect(page.getByRole("checkbox", { name: "열람자 문서 작성, 바뀜" })).toBeChecked();
    await userEvent.click(page.getByRole("link", { name: "태그" }));
    await userEvent.click(within(await page.findByRole("alertdialog")).getByRole("button", { name: "나가기" }));
    await expect(await page.findByRole("heading", { level: 1, name: "태그" })).toBeVisible();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰은 역할 하나의 기능 스위치 목록을 본다",
  args: { initialPath: "/permissions" },
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByText("역할");
    await expect(page.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.click(await page.findByRole("switch", { name: "문서 삭제" }));
    await expect(await page.findByRole("button", { name: "변경 1개 저장" })).toBeVisible();
  },
};

test(VerifySave.name, () => runSample(meta, VerifySave));
test(VerifyLeave.name, () => runSample(meta, VerifyLeave));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone));
