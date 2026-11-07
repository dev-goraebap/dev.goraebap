import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./AppShell.samples";

type Sample = SampleOf<typeof meta>;
const VerifySidebar: Sample = {
  name: "사이드바 접기·초점 검증",
  render: () => <samples.Shell />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "메뉴 접기" }));
    const expand = await page.findByRole("button", { name: "메뉴 펼치기" });
    await waitFor(() => expect(expand).toHaveFocus());
    await userEvent.click(expand);
    await waitFor(() => expect(page.getByRole("button", { name: "메뉴 접기" })).toHaveFocus());
    await userEvent.click(page.getByRole("link", { name: "일정" }));
    await expect(page.getByRole("link", { name: "일정" })).toHaveAttribute("aria-current", "page");
  },
};

const VerifyPhoneTabs: Sample = {
  name: "휴대폰 탭·더보기 검증",
  render: () => <samples.Shell />,
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const tabs = await page.findByRole("navigation", { name: "주 메뉴" });
    await expect(within(tabs).getByRole("link", { name: "모든 항목" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(within(tabs).getByRole("button", { name: "더보기" }));
    const sheet = await page.findByRole("dialog", { name: "더보기" });
    await expect(within(sheet).getByRole("link", { name: "설정" })).toBeVisible();
    await expect(page.getByRole("button", { name: "항목 추가" })).toBeVisible();
  },
};

test(VerifySidebar.name, () => runSample(meta, VerifySidebar));
test(VerifyPhoneTabs.name, () => runSample(meta, VerifyPhoneTabs));
