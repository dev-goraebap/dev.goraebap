import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta from "./Folders.samples";

type Sample = SampleOf<typeof meta>;

const VerifyTreeKeys: Sample = {
  name: "나무 키보드와 경로 검증",
  args: { initialPath: "/folders/design" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const current = await page.findByRole("treeitem", { name: "디자인" });
    await expect(current).toHaveAttribute("aria-selected", "true");
    current.focus();
    // → 로 이미 펼친 폴더 안(첫 하위 폴더)으로, Enter로 열기.
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(page.getByRole("treeitem", { name: "아이콘" })).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await expect(await page.findByRole("heading", { level: 1, name: "아이콘" })).toBeInTheDocument();
    // ← 로 접힌 곳이 없으면 상위 폴더로.
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(page.getByRole("treeitem", { name: "디자인" })).toHaveFocus());
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(page.getByRole("treeitem", { name: "디자인" })).toHaveAttribute("aria-expanded", "false"));
    // 경로로 위로 가기.
    await userEvent.click(page.getByRole("link", { name: "문서" }));
    await expect(await page.findByRole("heading", { level: 1, name: "문서" })).toBeInTheDocument();
  },
};

const VerifyMove: Sample = {
  name: "옮기기 메뉴와 새 폴더 검증",
  args: { initialPath: "/folders/design" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "색 기준표.docx 메뉴" }));
    await userEvent.click(await page.findByRole("button", { name: "옮기기" }));
    const dialog = await page.findByRole("dialog", { name: /옮기기/ });
    await userEvent.click(within(dialog).getByRole("button", { name: "옮기기" }));
    await waitFor(() => expect(within(dialog).getAllByText("옮길 폴더를 골라 주세요.").length).toBeGreaterThan(0));
    await userEvent.click(within(dialog).getByRole("combobox", { name: /옮길 폴더/ }));
    await userEvent.click(await page.findByRole("option", { name: "내 폴더 / 보관함" }));
    await expect(within(dialog).getByRole("combobox", { name: /옮길 폴더/ })).toHaveTextContent("내 폴더 / 보관함");
    await userEvent.click(within(dialog).getByRole("button", { name: "옮기기" }));
    await waitFor(() => expect(page.queryByText("색 기준표.docx", { selector: "p, span" })).not.toBeInTheDocument(), { timeout: 4000 });
    // 새 폴더: 같은 이름은 막고, 새 이름은 만든다.
    await userEvent.click(page.getByRole("button", { name: "새 폴더" }));
    const create = await page.findByRole("dialog", { name: "새 폴더" });
    await userEvent.type(within(create).getByRole("textbox", { name: "폴더 이름" }), "아이콘");
    await userEvent.click(within(create).getByRole("button", { name: "만들기" }));
    await waitFor(() => expect(within(create).getByRole("textbox", { name: "폴더 이름" })).toHaveAttribute("aria-invalid", "true"));
    await userEvent.clear(within(create).getByRole("textbox", { name: "폴더 이름" }));
    await userEvent.type(within(create).getByRole("textbox", { name: "폴더 이름" }), "시안");
    await userEvent.click(within(create).getByRole("button", { name: "만들기" }));
    await expect(await page.findByRole("link", { name: "시안" })).toBeVisible();
  },
};

const VerifyDrag: Sample = {
  name: "끌어서 옮기기 검증",
  args: { initialPath: "/folders/design" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const row = (await page.findByText("로고 시안.png")).closest("tr")!;
    const target = page.getByRole("treeitem", { name: "회의록" });
    const data = new DataTransfer();
    const fire = (element: Element, type: string) => element.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }));
    fire(row, "dragstart");
    fire(target, "dragover");
    await waitFor(() => expect(target).toHaveAttribute("data-over", "true"));
    fire(target, "drop");
    fire(row, "dragend");
    await waitFor(() => expect(page.queryByText("로고 시안.png")).not.toBeInTheDocument(), { timeout: 4000 });
    expect((await page.findAllByText(/회의록 폴더로 옮겼습니다/)).length).toBeGreaterThan(0);
  },
};

const VerifyEmpty: Sample = {
  name: "빈 폴더 상태 검증",
  args: { initialPath: "/folders/archive" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(await page.findByText("이 폴더는 비어 있습니다")).toBeInTheDocument();
    await userEvent.click(page.getAllByRole("button", { name: "새 폴더" })[0]);
    const dialog = await page.findByRole("dialog", { name: "새 폴더" });
    await waitFor(() => expect(dialog).toBeVisible());
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 한 단계씩 들어가기 검증",
  args: { initialPath: "/folders" },
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.queryByRole("tree")).not.toBeInTheDocument();
    await userEvent.click(await page.findByRole("link", { name: /문서/ }));
    await expect(await page.findByRole("heading", { level: 1, name: "문서" })).toBeInTheDocument();
    // 앱 바의 ←가 위 폴더로 간다("내 폴더(으)로", 키트 Page는 단추 모양의 링크로 그린다).
    await userEvent.click(page.getByRole("button", { name: /^내 폴더/ }));
    await expect(await page.findByRole("link", { name: /사진/ })).toBeVisible();
  },
};

test(VerifyTreeKeys.name, () => runSample(meta, VerifyTreeKeys), 20000);
test(VerifyMove.name, () => runSample(meta, VerifyMove), 30000);
test(VerifyDrag.name, () => runSample(meta, VerifyDrag), 20000);
test(VerifyEmpty.name, () => runSample(meta, VerifyEmpty), 20000);
test(VerifyPhone.name, () => runSample(meta, VerifyPhone), 20000);
