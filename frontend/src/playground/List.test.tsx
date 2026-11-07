import { test } from "vitest";
import { LibraryApp } from "./library/app/LibraryApp";
import { createResourceApi } from "./library/mocks/resource-api";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./List.samples";

type Sample = SampleOf<typeof meta>;
const VerifyJourney: Sample = {
  name: "추가·상세·목록 복귀 검증",
  args: { initialPath: "/resources" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "자료 추가" }));
    const dialog = await page.findByRole("dialog", { name: "새 자료" });
    await userEvent.type(within(dialog).getByRole("textbox", { name: "제목" }), "접근성 검토 기록");
    await userEvent.click(within(dialog).getByRole("button", { name: "컬렉션 (필수)" }));
    await userEvent.click(await page.findByRole("option", { name: "읽을거리" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "추가하기" }));
    await expect(await page.findByRole("heading", { level: 1, name: "접근성 검토 기록" })).toBeVisible();
    await userEvent.click(page.getByRole("link", { name: "서가" }));
    await expect(await page.findByRole("link", { name: /접근성 검토 기록/ })).toBeVisible();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 FAB·전체 화면 검증",
  args: { initialPath: "/resources" },
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("list", { name: "자료" });
    await expect(page.queryByRole("navigation", { name: "주 메뉴" })).toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "자료 추가" }));
    await expect(await page.findByRole("textbox", { name: "제목" })).toBeVisible();
    await waitFor(() => expect(page.queryByRole("navigation", { name: "주 메뉴" })).not.toBeInTheDocument());
    await expect(page.getByRole("button", { name: "추가하기" })).toBeVisible();
  },
};

test(VerifyJourney.name, () => runSample(meta, VerifyJourney));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone));
