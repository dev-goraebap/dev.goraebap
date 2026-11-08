import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Page.samples";

type Sample = SampleOf<typeof meta>;
const VerifyTableRows: Sample = {
  name: "표 행 열기 검증",
  render: () => <samples.TablePage />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByText("주소에 남겨야 하는 화면 상태"));
    await expect(await page.findByText("열었습니다: 주소에 남겨야 하는 화면 상태")).toBeVisible();
  },
};

test(VerifyTableRows.name, () => runSample(meta, VerifyTableRows));
