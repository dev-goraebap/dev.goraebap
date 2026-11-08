import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Document.samples";

type Sample = SampleOf<typeof meta>;

const VerifyAutosave: Sample = {
  name: "고친 뒤 자동 저장 검증",
  render: () => <samples.DocumentScreen title="메모" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const title = page.getByRole("textbox", { name: "문서 제목" });
    await userEvent.type(title, " 수정");
    await expect(page.getByText("고친 내용 있음")).toBeVisible();
    await waitFor(() => expect(page.getByText("저장됨")).toBeVisible(), { timeout: 4000 });
    await expect(page.getByRole("textbox", { name: "문서 제목" })).toHaveValue("메모 수정");
  },
};

test(VerifyAutosave.name, () => runSample(meta, VerifyAutosave), 10000);
