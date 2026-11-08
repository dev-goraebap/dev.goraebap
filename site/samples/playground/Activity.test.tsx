import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta from "./Activity.samples";

type Sample = SampleOf<typeof meta>;
const rowsOf = (root: HTMLElement) => [...root.ownerDocument.querySelectorAll<HTMLElement>("li:has(time)")];

const VerifyMore: Sample = {
  name: "더 보기·정확한 시각·사람 필터 검증",
  args: { initialPath: "/activity" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    // 처음 한 조각만 읽고, 오늘 구분이 맨 위에 온다.
    await expect(await page.findByText("46건 중 10건")).toBeVisible();
    await expect(rowsOf(canvasElement)).toHaveLength(10);
    await expect(page.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent("오늘");
    // 상대 시각에 포인터를 올리면 정확한 시각이 보인다.
    await userEvent.hover(rowsOf(canvasElement)[0].querySelector("time")!);
    await expect(await page.findByRole("tooltip")).toHaveTextContent("2026년 11월 8일 오전 10:40");
    await userEvent.unhover(rowsOf(canvasElement)[0].querySelector("time")!);
    // 더 보기는 다음 조각을 목록 아래에 이어 붙인다.
    await userEvent.click(page.getByRole("button", { name: "더 보기" }));
    await expect(await page.findByText("46건 중 20건")).toBeVisible();
    await expect(rowsOf(canvasElement)).toHaveLength(20);
    // 사람으로 거르면 그 사람의 기록만 남는다.
    await userEvent.click(page.getByRole("button", { name: "필터" }));
    await userEvent.click(await page.findByRole("option", { name: "사람" }));
    await userEvent.click(await page.findByRole("menuitemcheckbox", { name: "민준" }));
    await waitFor(() => expect(page.getByRole("button", { name: "필터 1개 적용 중" })).toBeVisible());
    await waitFor(() => expect(rowsOf(canvasElement).every(row => row.textContent?.includes("민준님이"))).toBe(true));
    await expect(rowsOf(canvasElement).length).toBeGreaterThan(0);
  },
};

const VerifyNoResults: Sample = {
  name: "조건 결과 없음에서 조건 지우기 검증",
  args: { initialPath: "/activity?period=today&actor=민준&type=delete" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(await page.findByText("조건에 맞는 활동이 없습니다")).toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "조건 지우기" }));
    await expect(await page.findByText("46건 중 10건")).toBeVisible();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 활동 기록 더 보기 검증",
  args: { initialPath: "/activity" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(await page.findByText("46건 중 10건")).toBeVisible();
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    await userEvent.click(page.getByRole("button", { name: "필터" }));
    await expect(await page.findByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(page.getByRole("button", { name: "더 보기" }));
    await expect(await page.findByText("46건 중 20건")).toBeVisible();
  },
};

test(VerifyMore.name, () => runSample(meta, VerifyMore), 20000);
test(VerifyNoResults.name, () => runSample(meta, VerifyNoResults));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone, "phone"), 20000);
