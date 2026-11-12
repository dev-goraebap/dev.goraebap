import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta from "./Tags.samples";

type Sample = SampleOf<typeof meta>;

const VerifyRename: Sample = {
  name: "중복 이름은 칸 곁에 알리고 고치면 저장한다",
  args: { initialPath: "/tags" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "디자인 메뉴" }));
    await userEvent.click(await page.findByRole("button", { name: "이름 바꾸기" }));
    const dialog = await page.findByRole("dialog", { name: "태그 이름 바꾸기" });
    const name = within(dialog).getByRole("textbox", { name: /이름/ });
    await userEvent.clear(name);
    await userEvent.type(name, "개발");
    await userEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    await expect(await within(dialog).findByText("'개발' 태그가 이미 있습니다.")).toBeInTheDocument();
    await userEvent.clear(name);
    await userEvent.type(name, "시각 디자인");
    await userEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(await page.findByText("시각 디자인")).toBeVisible();
  },
};

const VerifyRemove: Sample = {
  name: "쓰인 태그는 수를 밝혀 확인받고 안 쓰인 태그는 바로 지운다",
  args: { initialPath: "/tags" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "긴급 메뉴" }));
    await userEvent.click(await page.findByRole("button", { name: "지우기" }));
    const alert = await page.findByRole("alertdialog");
    await expect(within(alert).getByText(/6개 항목/)).toBeInTheDocument();
    await userEvent.click(within(alert).getByRole("button", { name: "지우기" }));
    await waitFor(() => expect(page.queryByText("긴급")).not.toBeInTheDocument());
    await userEvent.click(await page.findByRole("button", { name: "회의 메뉴" }));
    await userEvent.click(await page.findByRole("button", { name: "지우기" }));
    await waitFor(() => expect(page.queryByText("회의")).not.toBeInTheDocument());
    await expect(page.queryByRole("alertdialog")).not.toBeInTheDocument();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 추가 FAB·전체 화면 양식 검증",
  args: { initialPath: "/tags" },
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("list", { name: "태그" });
    await userEvent.click(page.getByRole("button", { name: "태그 추가" }));
    const dialog = await page.findByRole("dialog", { name: "새 태그" });
    await userEvent.click(within(dialog).getByRole("button", { name: "추가하기" }));
    await expect(await within(dialog).findByText("태그 이름을 입력해 주세요.", { ignore: "script, style, [data-astryx-modal-live-region]" })).toBeInTheDocument();
  },
};

test(VerifyRename.name, () => runSample(meta, VerifyRename));
test(VerifyRemove.name, () => runSample(meta, VerifyRemove));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone));
