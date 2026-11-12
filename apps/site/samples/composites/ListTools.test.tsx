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
    // 찾는 말이 걸려 있으면 돋보기에 점이 붙고, 누르면 그 자리가 찾기 칸이 된다. Esc로 접어도 찾는 말은 남는다.
    await userEvent.click(await page.findByRole("button", { name: "자료 검색, 찾는 중" }));
    const box = await page.findByRole("searchbox", { name: "자료 검색" });
    await waitFor(() => expect(box).toHaveFocus());
    await expect(box).toHaveValue("기준");
    await userEvent.keyboard("{Escape}");
    const trigger = await page.findByRole("button", { name: "자료 검색, 찾는 중" });
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await expect(page.getByRole("searchbox", { name: "자료 검색" })).toHaveValue("기준");
    await userEvent.click(page.getByRole("button", { name: "자료 검색 닫기" }));
    await expect(page.getByRole("button", { name: "자료 검색, 찾는 중" })).toBeVisible();
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
    await userEvent.click(await page.findByRole("option", { name: "문서" }));
    await expect(await page.findByRole("navigation", { name: "적용한 필터" })).toBeVisible();
    await expect(page.getByRole("button", { name: "필터, 1개 적용 중" })).toBeVisible();
  },
};

test(VerifySearch.name, () => runSample(meta, VerifySearch));
test(VerifyFilter.name, () => runSample(meta, VerifyFilter));
