import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta from "./Users.samples";

type Sample = SampleOf<typeof meta>;

const VerifyBulk: Sample = {
  name: "행을 골라 일괄 비활성화한다",
  args: { initialPath: "/users" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("checkbox", { name: /지우/ }));
    await userEvent.click(page.getByRole("checkbox", { name: /도현/ }));
    const bar = await page.findByRole("region", { name: "선택한 사용자 동작" });
    await expect(within(bar).getByText("2명 선택")).toBeVisible();
    await userEvent.click(within(bar).getByRole("button", { name: "비활성화" }));
    const alert = await page.findByRole("alertdialog");
    await userEvent.click(within(alert).getByRole("button", { name: "비활성화" }));
    await waitFor(() => expect(page.queryByRole("region", { name: "선택한 사용자 동작" })).not.toBeInTheDocument());
    await waitFor(() => expect(page.getAllByText("비활성").length).toBe(4));
  },
};

const VerifyInvite: Sample = {
  name: "초대는 잘못된 이메일을 알리고 맞으면 목록에 더한다",
  args: { initialPath: "/users?invite=true" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("dialog", { name: "사용자 초대" });
    const field = within(dialog).getByRole("textbox", { name: /이메일/ });
    await userEvent.type(field, "hajun@example.com, wrong");
    await userEvent.click(within(dialog).getByRole("button", { name: "초대 보내기" }));
    await expect(await within(dialog).findByText("올바르지 않은 이메일입니다: wrong")).toBeInTheDocument();
    await userEvent.clear(field);
    await userEvent.type(field, "hajun@example.com");
    await userEvent.click(within(dialog).getByRole("button", { name: "초대 보내기" }));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(await page.findByText("hajun@example.com")).toBeVisible();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰은 행 목록에서 고르고 일괄 동작을 쓴다",
  args: { initialPath: "/users" },
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("list", { name: "사용자" });
    await expect(page.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.click(page.getByRole("checkbox", { name: "서윤 선택" }));
    await expect(await page.findByText("1명 선택")).toBeVisible();
    await expect(page.getByRole("button", { name: "역할 바꾸기" })).toBeVisible();
  },
};

test(VerifyBulk.name, () => runSample(meta, VerifyBulk));
test(VerifyInvite.name, () => runSample(meta, VerifyInvite));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone));
