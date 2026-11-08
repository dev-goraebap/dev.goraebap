import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./ListTools.samples";

type Sample = SampleOf<typeof meta>;
const VerifySearch: Sample = {
  name: "검색 접기·지우기 검증",
  render: () => <samples.Tools query="기준" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const box = await page.findByRole("textbox", { name: "자료 검색" });
    await userEvent.click(box);
    await userEvent.keyboard("{Escape}");
    const trigger = await page.findByRole("button", { name: "자료 검색, 검색 중" });
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await expect(page.getByRole("textbox", { name: "자료 검색" })).toHaveValue("기준");
    await userEvent.click(page.getByRole("button", { name: "자료 검색 닫기" }));
    await expect(page.getByRole("button", { name: "자료 검색, 검색 중" })).toBeVisible();
  },
};

const VerifyFilter: Sample = {
  name: "필터 적용 줄 검증",
  render: () => <samples.Tools />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.queryByRole("navigation", { name: "적용한 필터" })).not.toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "표시" }));
    await userEvent.click(await page.findByRole("button", { name: "제목" }));
    await expect(page.queryByRole("navigation", { name: "적용한 필터" })).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(page.getByRole("button", { name: "필터" }));
    await userEvent.click(await page.findByRole("option", { name: "종류" }));
    await userEvent.click(await page.findByRole("menuitemcheckbox", { name: "문서" }));
    await expect(await page.findByRole("navigation", { name: "적용한 필터" })).toBeVisible();
    await expect(page.getByRole("button", { name: "필터 1개 적용 중" })).toBeVisible();
  },
};

test(VerifySearch.name, () => runSample(meta, VerifySearch));
test(VerifyFilter.name, () => runSample(meta, VerifyFilter));
