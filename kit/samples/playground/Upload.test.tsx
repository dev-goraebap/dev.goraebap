import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Upload.samples";

type Sample = SampleOf<typeof meta>;

const VerifyRetry: Sample = {
  name: "실패한 파일 다시 올리기 검증",
  render: () => <samples.UploadScreen initial={[{ id: "x", name: "실패하는 표본.docx", size: 120_000, state: "waiting", progress: 0 }]} />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const retry = await page.findByRole("button", { name: "실패하는 표본.docx 다시 올리기" }, { timeout: 6000 });
    await expect(page.getByText(/올리지 못했습니다/)).toBeVisible();
    await userEvent.click(retry);
    await waitFor(() => expect(page.getByText("1개 중 1개 완료")).toBeVisible(), { timeout: 8000 });
  },
};

test(VerifyRetry.name, () => runSample(meta, VerifyRetry), 20000);
