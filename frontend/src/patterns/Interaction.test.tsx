import { test } from "vitest";
import { LibraryApp } from "../playground/library/app/LibraryApp";
import { createResourceApi } from "../playground/library/mocks/resource-api";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Interaction.samples";

type Sample = SampleOf<typeof meta>;
const VerifyRowControls: Sample = {
  name: "행 안의 동작이 행을 열지 않는지 검증",
  args: { initialPath: "/resources" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const rows = await page.findByRole("list", { name: "자료" });
    await userEvent.click(within(rows).getAllByRole("button", { name: "지우의 자료만 보기" })[0]);
    await expect(await page.findByRole("navigation", { name: "적용한 필터" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "모든 자료" })).toBeInTheDocument();
    await userEvent.click(within(page.getByRole("list", { name: "자료" })).getAllByRole("link")[0]);
    await waitFor(() => expect(page.getByRole("heading", { level: 1 })).not.toHaveTextContent("모든 자료"));
  },
};

test(VerifyRowControls.name, () => runSample(meta, VerifyRowControls));
