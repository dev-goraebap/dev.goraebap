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
    // 빠진 필수 알약은 aria-invalid를 받고, 제출 검사가 그리로 초점을 옮긴다.
    const priority = within(dialog).getByRole("button", { name: "우선순위 (필수)" });
    await expect(priority).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(priority).toHaveFocus());
    await userEvent.click(priority);
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

const VerifyEdit: Sample = {
  name: "편집 단추가 수정 화면을 열고 본문 링크는 제자리에서 가는지 검증",
  args: { initialPath: "/issues/ISS-12" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const edit = await page.findByRole("button", { name: "편집" });
    const title = page.getByRole("heading", { level: 1 }).textContent ?? "";
    await userEvent.click(edit);
    // 수정 화면은 제목과 본문만 둔다(속성·하위 이슈·활동 없음).
    await expect(await page.findByRole("textbox", { name: "제목" })).toHaveValue(title);
    await expect(page.getByRole("textbox", { name: "본문" })).toBeVisible();
    await expect(page.queryByRole("region", { name: "하위 이슈" })).not.toBeInTheDocument();
    await expect(page.queryByRole("button", { name: "상태" })).not.toBeInTheDocument();
    // 고친 것이 없으면 취소는 묻지 않고 상세로 돌아간다.
    await userEvent.click(page.getByRole("button", { name: "취소" }));
    await expect(await page.findByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.queryByRole("alertdialog")).not.toBeInTheDocument();
  },
};

test(VerifyCreate.name, () => runSample(meta, VerifyCreate));
test(VerifyEdit.name, () => runSample(meta, VerifyEdit), 15000);
test(VerifyBoard.name, () => runSample(meta, VerifyBoard));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone));
