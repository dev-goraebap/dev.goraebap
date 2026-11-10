import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import { LibrarySample } from "./library-sample";
import meta from "./Documents.samples";

type Sample = SampleOf<typeof meta>;
const VerifyJourney: Sample = {
  name: "추가·상세·목록 복귀 검증",
  render: () => <LibrarySample initialPath="/resources" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "자료 추가" }));
    const dialog = await page.findByRole("dialog", { name: "새 자료" });
    await userEvent.type(within(dialog).getByRole("textbox", { name: "제목" }), "접근성 검토 기록");
    await userEvent.click(within(dialog).getByRole("button", { name: "컬렉션 (필수)" }));
    await userEvent.click(await page.findByRole("option", { name: "읽을거리" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "추가하기" }));
    await expect(await page.findByRole("heading", { level: 1, name: "접근성 검토 기록" })).toBeVisible();
    await userEvent.click(page.getByRole("link", { name: "서가" }));
    await expect(await page.findByRole("link", { name: /접근성 검토 기록/ })).toBeVisible();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 FAB·전체 화면 검증",
  render: () => <LibrarySample initialPath="/resources" />,
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("list", { name: "자료" });
    await expect(page.queryByRole("navigation", { name: "주 메뉴" })).toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "자료 추가" }));
    await expect(await page.findByRole("textbox", { name: "제목" })).toBeVisible();
    await waitFor(() => expect(page.queryByRole("navigation", { name: "주 메뉴" })).not.toBeInTheDocument());
    await expect(page.getByRole("button", { name: "추가하기" })).toBeVisible();
  },
};

const VerifyEdit: Sample = {
  name: "편집 단추·수정 화면·취소 확인·완료 검증",
  render: () => <LibrarySample initialPath="/resources/design-tokens" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    // 상세의 편집 단추는 수정 화면(제목과 본문만)을 연다.
    await userEvent.click(await page.findByRole("button", { name: "편집" }));
    const title = await page.findByRole("textbox", { name: "제목" });
    await expect(page.queryByRole("button", { name: "종류" })).not.toBeInTheDocument();
    await expect(page.getByRole("button", { name: "저장" })).toHaveAttribute("aria-disabled", "true");
    // 고친 뒤 취소하면 먼저 묻고, 계속 작성하면 그대로 남는다.
    await userEvent.type(title, " 다시 읽기");
    await expect(page.getByText("저장 안 됨")).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "취소" }));
    const ask = await page.findByRole("alertdialog", { name: "저장하지 않은 내용이 있습니다" });
    await userEvent.click(within(ask).getByRole("button", { name: "계속 작성" }));
    await expect(title).toHaveValue("좋은 인터페이스를 만드는 작은 기준들 다시 읽기");
    // Ctrl+S는 제자리에서 저장한다.
    title.focus();
    await userEvent.keyboard("{Control>}s{/Control}");
    await waitFor(() => expect(page.getByText("저장됨")).toBeVisible());
    // 완료는 저장하고 상세로 돌아간다.
    await userEvent.type(title, "!");
    await userEvent.click(page.getByRole("button", { name: "완료" }));
    await expect(await page.findByRole("heading", { level: 1, name: "좋은 인터페이스를 만드는 작은 기준들 다시 읽기!" })).toBeVisible();
    // 고친 것이 없으면 취소는 묻지 않고 돌아간다.
    await userEvent.click(page.getByRole("button", { name: "편집" }));
    await userEvent.click(await page.findByRole("button", { name: "취소" }));
    await expect(await page.findByRole("heading", { level: 1, name: /다시 읽기!/ })).toBeVisible();
    await expect(page.queryByRole("alertdialog")).not.toBeInTheDocument();
  },
};

const VerifyPageFoot: Sample = {
  name: "작성 페이지 바닥 고정·동작만 검증",
  render: () => <LibrarySample initialPath="/resources/new" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const submit = await page.findByRole("button", { name: "추가하기" });
    // 동작은 본문 아래가 아니라 화면 바닥에 붙은 줄에 있고, 줄에는 버튼만 있다.
    const bar = submit.closest("[class*='foot']") as HTMLElement;
    await expect(bar).not.toBeNull();
    await expect(within(bar).getByRole("button", { name: "취소" })).toBeVisible();
    // 줄은 스크롤되는 본문 밖(페이지 바닥)에 있어 본문을 내려도 늘 보인다.
    let scroller = page.getByRole("textbox", { name: "제목" }).parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    await expect(scroller).not.toBeNull();
    await expect(scroller!.contains(bar)).toBe(false);
    await expect([...bar.querySelectorAll("button")].map(each => each.textContent?.trim())).toEqual(["취소", "추가하기"]);
    // 빠진 값 안내는 칸 곁에 보이고 바닥 줄에는 들어가지 않는다.
    await userEvent.click(submit);
    const hint = await page.findByText(/필수 속성을 정해 주세요/);
    await expect(bar.contains(hint)).toBe(false);
  },
};

test(VerifyJourney.name, () => runSample(meta, VerifyJourney));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone));
test(VerifyEdit.name, () => runSample(meta, VerifyEdit), 15000);
test(VerifyPageFoot.name, () => runSample(meta, VerifyPageFoot));
