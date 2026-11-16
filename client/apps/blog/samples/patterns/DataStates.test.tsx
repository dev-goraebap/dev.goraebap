import { test } from "vitest";
import { LibraryApp } from "../playground/library/app/LibraryApp";
import { createResourceApi } from "../playground/library/mocks/resource-api";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./DataStates.samples";

type Sample = SampleOf<typeof meta>;
const VerifyClearConditions: Sample = {
  name: "조건 지우기 검증",
  render: () => <LibraryApp api={createResourceApi({ delay: 0 })} initialPath="/resources?q=없는검색어&kind=image" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "조건 지우기" }));
    await expect(await page.findByRole("link", { name: /좋은 인터페이스를 만드는 작은 기준들/ })).toBeVisible();
    // 걸린 필터 줄(필터마다 "<이름> 필터" 묶음)도 함께 걷힌다.
    await expect(page.queryByRole("group", { name: "종류 필터" })).not.toBeInTheDocument();
  },
};

test(VerifyClearConditions.name, () => runSample(meta, VerifyClearConditions));
