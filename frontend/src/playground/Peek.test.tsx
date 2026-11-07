import { test } from "vitest";
import { LibraryApp } from "./library/app/LibraryApp";
import { createResourceApi } from "./library/mocks/resource-api";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Peek.samples";

type Sample = SampleOf<typeof meta>;
const VerifyPeek: Sample = {
  name: "열기·옮기기·닫기 검증",
  args: { initialPath: "/resources" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "기다리는 시간을 설계하는 방법 미리보기" }));
    const panel = await page.findByRole("complementary", { name: "미리보기: 기다리는 시간을 설계하는 방법" });
    await expect(within(panel).getByRole("heading", { level: 2, name: "기다리는 시간을 설계하는 방법" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "모든 자료" })).toBeInTheDocument();
    const row = page.getAllByRole("link", { name: /기다리는 시간을 설계하는 방법/ })[0];
    row.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(page.getByRole("complementary", { name: /^미리보기: / })).not.toHaveAccessibleName("미리보기: 기다리는 시간을 설계하는 방법"));
    // 열린 툴팁은 맨 위 레이어라 첫 Esc를 먼저 가져간다. 포인터를 치워 툴팁이 없는 상태에서 누른다.
    await userEvent.unhover(page.getByRole("button", { name: "기다리는 시간을 설계하는 방법 미리보기" }));
    await waitFor(() => expect(page.queryByRole("tooltip")).not.toBeInTheDocument());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("complementary", { name: /^미리보기: / })).not.toBeInTheDocument());
    await userEvent.keyboard(" ");
    await expect(await page.findByRole("complementary", { name: /^미리보기: / })).toBeVisible();
  },
};

test(VerifyPeek.name, () => runSample(meta, VerifyPeek));
