import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Issues.samples";

type Sample = SampleOf<typeof meta>;
void samples;

const VerifyCreate: Sample = {
  name: "추가·상세·목록 복귀 검증",
  args: { initialPath: "/issues" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "이슈 추가" }));
    const dialog = await page.findByRole("dialog", { name: "새 이슈" });
    // 필수 속성을 비운 채 제출하면 곁에 알리고 제출 버튼은 막혀 있지 않다.
    await userEvent.type(within(dialog).getByRole("textbox", { name: "제목" }), "알림 설정 문구 점검");
    await userEvent.click(within(dialog).getByRole("button", { name: "추가하기" }));
    await expect(await within(dialog).findByText("필수 속성을 정해 주세요: 우선순위")).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "우선순위 (필수)" }));
    await userEvent.click(await page.findByRole("option", { name: "높음" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "추가하기" }));
    await expect(await page.findByRole("heading", { level: 1, name: "알림 설정 문구 점검" })).toBeVisible();
    await userEvent.click(page.getAllByRole("link", { name: "이슈" })[0]);
    await expect(await page.findByRole("link", { name: /알림 설정 문구 점검/ })).toBeVisible();
  },
};

const VerifyBoard: Sample = {
  name: "보드 전환·필터 검증",
  args: { initialPath: "/issues" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("list", { name: "이슈" });
    await userEvent.click(page.getByRole("button", { name: "표시" }));
    await userEvent.click(await page.findByRole("button", { name: "보드" }));
    const board = await page.findByRole("region", { name: "상태별 보드" });
    for (const name of ["할 일", "진행 중", "검토 중", "완료"]) await expect(within(board).getByRole("region", { name })).toBeVisible();
    await expect(within(within(board).getByRole("region", { name: "진행 중" })).getByRole("link", { name: /ISS-12/ })).toBeVisible();
    // 담당자를 누르면 그 사람으로 거르고 보드가 줄어든다.
    await userEvent.click(await page.findByRole("button", { name: "리스트" }));
    await expect(await page.findByRole("list", { name: "이슈" })).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "표시" }));
    await userEvent.unhover(page.getByRole("button", { name: "표시" }));
    await userEvent.click(page.getAllByRole("button", { name: "도현의 이슈만 보기" })[0]);
    await waitFor(() => expect(page.queryByRole("link", { name: /ISS-12/ })).not.toBeInTheDocument());
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 보드·FAB·전체 화면 검증",
  args: { initialPath: "/issues?layout=board" },
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("region", { name: "상태별 보드" });
    await expect(page.queryByRole("navigation", { name: "주 메뉴" })).toBeInTheDocument();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await userEvent.click(page.getByRole("button", { name: "이슈 추가" }));
    await expect(await page.findByRole("textbox", { name: "제목" })).toBeVisible();
    await waitFor(() => expect(page.queryByRole("navigation", { name: "주 메뉴" })).not.toBeInTheDocument());
    await expect(page.getByRole("button", { name: "추가하기" })).toBeVisible();
  },
};

test(VerifyCreate.name, () => runSample(meta, VerifyCreate));
test(VerifyBoard.name, () => runSample(meta, VerifyBoard));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone));
