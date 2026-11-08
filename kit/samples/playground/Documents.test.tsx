import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import { DocumentScreen } from "./documents/DocumentScreen";
import { UploadScreen } from "./documents/UploadScreen";
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

const VerifyAutosave: Sample = {
  name: "고친 뒤 자동 저장 검증",
  render: () => <DocumentScreen title="메모" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const title = page.getByRole("textbox", { name: "문서 제목" });
    await userEvent.type(title, " 수정");
    await expect(page.getByText("고친 내용 있음")).toBeVisible();
    await waitFor(() => expect(page.getByText("저장됨")).toBeVisible(), { timeout: 4000 });
    await expect(page.getByRole("textbox", { name: "문서 제목" })).toHaveValue("메모 수정");
  },
};

const VerifyRetry: Sample = {
  name: "실패한 파일 다시 올리기 검증",
  render: () => <UploadScreen initial={[{ id: "x", name: "실패하는 표본.docx", size: 120_000, state: "waiting", progress: 0 }]} />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const retry = await page.findByRole("button", { name: "실패하는 표본.docx 다시 올리기" }, { timeout: 6000 });
    await expect(page.getByText(/올리지 못했습니다/)).toBeVisible();
    await userEvent.click(retry);
    await waitFor(() => expect(page.getByText("1개 중 1개 완료")).toBeVisible(), { timeout: 8000 });
  },
};

const VerifyPeek: Sample = {
  name: "열기·옮기기·닫기 검증",
  render: () => <LibrarySample initialPath="/resources" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "기다리는 시간을 설계하는 방법 미리보기" }));
    const panel = await page.findByRole("complementary", { name: "미리보기: 기다리는 시간을 설계하는 방법" });
    await expect(await within(panel).findByRole("heading", { level: 2, name: "기다리는 시간을 설계하는 방법" })).toBeVisible();
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
test(VerifyAutosave.name, () => runSample(meta, VerifyAutosave), 10000);
test(VerifyRetry.name, () => runSample(meta, VerifyRetry), 20000);
test(VerifyPeek.name, () => runSample(meta, VerifyPeek));
test(VerifyPageFoot.name, () => runSample(meta, VerifyPageFoot));
