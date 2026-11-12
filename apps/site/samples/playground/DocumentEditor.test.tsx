import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta from "./DocumentEditor.samples";

type Sample = SampleOf<typeof meta>;
const pageCount = (root: HTMLElement) => Number(root.ownerDocument.querySelector<HTMLElement>("[data-page-count]")?.dataset.pageCount ?? 0);

/**
 * 페이지를 재는 단위(맨 위 블록, 목록 항목, 표 행)마다 자기 종이의 본문 영역 안에 있는지 잰다. 두 페이지에 걸친 긴 문단은 줄마다 잰다.
 * 넘긴 블록·행은 다음 페이지 첫머리에 붙어야 한다.
 */
function boundaryProblems(root: HTMLElement) {
  const document = root.ownerDocument;
  const prose = document.querySelector<HTMLElement>(".ProseMirror")!;
  const canvas = prose.closest<HTMLElement>("[data-page-count]")!;
  // 여백은 종이 틀의 실제 값(rem)을 읽는다: 문서 설정으로 바뀐다.
  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const remOf = (name: string) => parseFloat(getComputedStyle(canvas).getPropertyValue(name)) * rootPx;
  const zoom = canvas.getBoundingClientRect().width / remOf("--pg-width");
  const marginTop = remOf("--pg-margin-top") * zoom, marginBottom = remOf("--pg-margin-bottom") * zoom;
  const sheets = [...document.querySelectorAll("[data-sheet]")].map(sheet => sheet.getBoundingClientRect());
  const units = [...prose.children].flatMap(child => child.matches("ul, ol") && child.children.length > 1 ? [...child.children]
    : child.querySelector("table") ? [...child.querySelectorAll("tr")] : [child]).filter(child => !child.classList.contains("pg-gap"));
  const problems: string[] = [];
  const check = (rect: DOMRect, label: string, isStart: boolean) => {
    const sheet = sheets.find(each => rect.top >= each.top - 1 && rect.top < each.bottom);
    if (!sheet) { problems.push(`${label}: 종이 밖`); return; }
    if (rect.top < sheet.top + marginTop - 1) problems.push(`${label}: 위 여백 침범`);
    if (rect.bottom > sheet.bottom - marginBottom + 1) problems.push(`${label}: 아래 여백 침범 ${(rect.bottom - sheet.bottom + marginBottom).toFixed(1)}px`);
    if (isStart && Math.abs(rect.top - sheet.top - marginTop) > 1) problems.push(`${label}: 페이지 첫머리에서 ${(rect.top - sheet.top - marginTop).toFixed(1)}px`);
  };
  for (const unit of units) {
    const label = unit.textContent?.slice(0, 16) ?? "";
    if (unit.querySelector(".pg-line-gap")) {
      // 줄마다: 글자 조각(텍스트 노드)의 상자만 잰다. 끼워 넣은 빈 줄(간격)은 재지 않는다.
      const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(text);
        for (const line of [...range.getClientRects()].filter(each => each.height > 4)) check(line, `${label}(줄)`, false);
      }
      continue;
    }
    const rect = unit.getBoundingClientRect();
    if (rect.height) check(rect, label, unit.classList.contains("pg-start"));
  }
  return problems;
}

const VerifyEditing: Sample = {
  name: "서식 막대·페이지 나누기·쓰면 늘어나는 페이지 검증",
  args: { initialPath: "/documents/spec/edit" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const toolbar = await page.findByRole("toolbar", { name: "서식" });
    await waitFor(() => expect(pageCount(canvasElement)).toBeGreaterThan(5), { timeout: 8000 });
    await waitFor(() => expect(boundaryProblems(canvasElement)).toEqual([]), { timeout: 8000 });
    // 긴 문단은 줄 단위로, 긴 표는 행 단위로 두 페이지에 걸쳐 잇는다.
    await expect(canvasElement.ownerDocument.querySelector(".pg-line-gap")).not.toBeNull();
    await expect(canvasElement.ownerDocument.querySelector("tr.pg-row-gap")).not.toBeNull();
    // 서식 막대: 커서 자리의 서식이 보이고, 고른 글에 굵게를 입힌다.
    const editor = page.getByRole("textbox", { name: "본문" });
    const first = editor.querySelector("h2")!;
    await userEvent.click(first);
    await waitFor(() => expect(within(toolbar).getByRole("button", { name: "블록 종류" })).toHaveTextContent("제목 2"));
    await userEvent.tripleClick(editor.querySelector("p")!);
    await userEvent.click(within(toolbar).getByRole("button", { name: "굵게" }));
    await expect(editor.querySelector("p strong")).not.toBeNull();
    await expect(within(toolbar).getByRole("button", { name: "굵게" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(within(toolbar).getByRole("button", { name: "되돌리기" }));
    await waitFor(() => expect(editor.querySelector("p strong")).toBeNull());
    // 끝에 쓰면 페이지가 늘고, 늘어난 뒤에도 경계가 맞다.
    const before = pageCount(canvasElement);
    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}{End}{/Control}");
    for (let line = 0; line < 30; line += 1) await userEvent.keyboard(`{Enter}새로 쓴 문단 ${line + 1}`);
    await waitFor(() => expect(pageCount(canvasElement)).toBeGreaterThan(before), { timeout: 8000 });
    await waitFor(() => expect(boundaryProblems(canvasElement)).toEqual([]), { timeout: 8000 });
    await expect(page.getByText(`${pageCount(canvasElement)}페이지`, { exact: true })).toBeVisible();
    // 고친 것이 있으면 저장 상태가 바뀌고, 취소는 먼저 묻는다(계속 작성하면 그대로 남는다).
    await expect(page.getAllByRole("status").some(each => each.textContent === "저장 안 됨")).toBe(true);
    await userEvent.click(page.getByRole("button", { name: "취소" }));
    const ask = await page.findByRole("alertdialog");
    await userEvent.click(within(ask).getByRole("button", { name: "계속 작성" }));
    await expect(page.getByRole("textbox", { name: "본문" })).toHaveTextContent("새로 쓴 문단 30");
    // 페이지 없음으로 바꿔도 쓴 내용이 그대로다.
    // 보기 전환은 칸 고르기(SegmentedControl)라 누름 단추다.
    await userEvent.click(page.getByRole("button", { name: "페이지 없음" }));
    await waitFor(() => expect(canvasElement.ownerDocument.querySelector("[data-page-count]")).toBeNull());
    await expect(page.getByRole("textbox", { name: "본문" })).toHaveTextContent("새로 쓴 문단 30");
  },
};

const VerifyReading: Sample = {
  name: "페이지로 읽기·페이지 항목·페이지 모양·페이지 없음 검증",
  args: { initialPath: "/documents/spec" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(pageCount(canvasElement)).toBeGreaterThan(5), { timeout: 8000 });
    await waitFor(() => expect(boundaryProblems(canvasElement)).toEqual([]), { timeout: 8000 });
    const count = pageCount(canvasElement);
    // 오른쪽 속성 칸의 페이지 항목: 페이지 수, 누르면 페이지 목록(대표 제목), 고르면 그 페이지로 간다.
    const properties = page.getByRole("complementary", { name: "속성" });
    const pill = within(properties).getByRole("button", { name: "페이지" });
    await expect(pill).toHaveTextContent(`${count}페이지`);
    await userEvent.click(pill);
    const popover = await page.findByRole("dialog", { name: "페이지" });
    const labels = [...popover.querySelectorAll("li, [role=listitem], [role=option], [role=menuitem]")].map(item => item.textContent ?? "").filter(Boolean);
    await expect(labels.length).toBe(count);
    await expect(labels[0]).toContain("1. 소개와 목표");
    await expect(labels.some(label => label.includes("제목 없음"))).toBe(false);
    // 제목은 페이지 끝에 홀로 남지 않는다: 제목 바로 뒤의 블록은 같은 페이지에서 시작한다.
    // 한 번에 재어(그 사이 스크롤·다시 나누기가 끼지 않게) 배치가 안정될 때까지 기다린다.
    const orphanHeadings = () => {
      const sheets = [...canvasElement.ownerDocument.querySelectorAll("[data-sheet]")].map(sheet => sheet.getBoundingClientRect());
      const pageOf = (element: Element) => sheets.findIndex(sheet => element.getBoundingClientRect().top >= sheet.top && element.getBoundingClientRect().top < sheet.bottom);
      return [...canvasElement.ownerDocument.querySelectorAll(".ProseMirror > :is(h2, h3)")].flatMap(heading => {
        let next = heading.nextElementSibling;
        while (next?.classList.contains("pg-gap")) next = next.nextElementSibling;
        if (!next) return [];
        return pageOf(next.matches("ul, ol") ? next.firstElementChild ?? next : next) === pageOf(heading) ? [] : [heading.textContent ?? ""];
      });
    };
    await waitFor(() => expect(orphanHeadings()).toEqual([]), { timeout: 5000 });
    await userEvent.keyboard("{Escape}");
    // 페이지 모양: 구분선 + 물결이면 종이 사이마다 선이 하나, 연한 바탕이면 바깥이 종이와 다른 색이다.
    await userEvent.click(page.getByRole("button", { name: "페이지 모양" }));
    await userEvent.click(await page.findByRole("button", { name: "구분선" }));
    await userEvent.click(await page.findByRole("button", { name: "물결" }));
    const canvas = () => canvasElement.ownerDocument.querySelector<HTMLElement>("[data-page-count]")!;
    await waitFor(() => expect(canvas().dataset.line).toBe("wavy"));
    await expect(canvas().querySelectorAll("[data-sheet] > :last-child:not([data-sheet])").length).toBeGreaterThan(0);
    await userEvent.click(await page.findByRole("button", { name: "연한 바탕" }));
    await waitFor(() => expect(canvas().dataset.look).toBe("tinted"));
    const desk = canvas().closest("[data-print-root]")!;
    await expect(getComputedStyle(desk).backgroundColor).not.toBe(getComputedStyle(canvas().querySelector("[data-sheet]")!).backgroundColor);
    await userEvent.keyboard("{Escape}");
    await userEvent.click(page.getByRole("button", { name: "페이지 없음" }));
    await waitFor(() => expect(canvasElement.ownerDocument.querySelector("[data-page-count]")).toBeNull());
    await expect(within(page.getByRole("complementary", { name: "속성" })).queryByRole("button", { name: "페이지" })).toBeNull();
    await expect(page.getAllByRole("heading", { level: 1, name: "시스템 정의서" }).length).toBeGreaterThan(0);
  },
};

const VerifySettings: Sample = {
  name: "머리말·바닥글·문서 설정·확대/축소 검증",
  args: { initialPath: "/documents/spec/edit" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const document = canvasElement.ownerDocument;
    await waitFor(() => expect(pageCount(canvasElement)).toBeGreaterThan(5), { timeout: 8000 });
    // 종이마다 머리말과 {page}/{total}을 채운 바닥글이 있다.
    const first = document.querySelector('[data-sheet="1"]')!, count = pageCount(canvasElement);
    await expect(first).toHaveTextContent("시스템 정의서");
    await expect(first).toHaveTextContent(`1 / ${count}`);
    await expect(document.querySelector('[data-sheet="2"]')).toHaveTextContent(`2 / ${count}`);
    // 바닥글을 두 번 누르면 문서 설정의 머리말·바닥글 칸이 열리고, 고친 글이 모든 종이에 보인다.
    await userEvent.dblClick(first.querySelector('[aria-label^="바닥글"]')!);
    const settings = await page.findByRole("complementary", { name: "문서 설정" });
    await expect(within(settings).getByRole("button", { name: "머리말 · 바닥글" })).toHaveAttribute("aria-pressed", "true");
    const center = within(settings).getByRole("textbox", { name: "가운데" });
    await userEvent.clear(center);
    await userEvent.type(center, "검토용");
    await waitFor(() => expect(document.querySelector(`[data-sheet="${count}"]`)).toHaveTextContent("검토용"));
    // 첫 페이지 다르게: 첫 종이에는 머리말·바닥글이 없다.
    await userEvent.click(within(settings).getByRole("switch", { name: /첫 페이지 다르게/ }));
    await waitFor(() => expect(document.querySelector('[data-sheet="1"]')).not.toHaveTextContent("시스템 정의서"));
    // 가로 용지로 바꾸면 종이가 넓어지고 다시 나눈다(쓴 내용은 그대로).
    await userEvent.click(within(settings).getByRole("button", { name: "문서" }));
    // 종이 폭(설정 값)이 넓어진다. 화면에서는 칸 폭에 맞춰 줄어들 수 있으므로 종이 틀의 값을 본다.
    const paperWidth = () => parseFloat(getComputedStyle(document.querySelector<HTMLElement>("[data-page-count]")!).getPropertyValue("--pg-width"));
    const before = paperWidth();
    await userEvent.click(within(settings).getByRole("button", { name: "가로" }));
    await waitFor(() => expect(paperWidth() / before).toBeCloseTo(297 / 210, 2));
    await waitFor(() => expect(boundaryProblems(canvasElement)).toEqual([]), { timeout: 8000 });
    // 확대/축소: 고정 배율로 바꾸면 종이 폭이 그만큼 바뀐다.
    const toolbar = page.getByRole("group", { name: "확대/축소" });
    const wide = document.querySelector<HTMLElement>("[data-page-count]")!.getBoundingClientRect().width;
    await userEvent.click(within(toolbar).getByRole("button", { name: "축소" }));
    await waitFor(() => expect(document.querySelector<HTMLElement>("[data-page-count]")!.getBoundingClientRect().width).toBeLessThan(wide - 10));
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰은 페이지 없이 쓰기 검증",
  args: { initialPath: "/documents/spec/edit" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(await page.findByRole("toolbar", { name: "서식" })).toBeVisible();
    await expect(canvasElement.ownerDocument.querySelector("[data-page-count]")).toBeNull();
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

// 서른 문단을 한 글자씩 치며 매번 다시 나누므로 오래 걸린다(키트 편집기에서 단독 실행 약 55초).
test(VerifyEditing.name, () => runSample(meta, VerifyEditing), 120000);
test(VerifyReading.name, () => runSample(meta, VerifyReading), 30000);
test(VerifySettings.name, () => runSample(meta, VerifySettings), 40000);
test(VerifyPhone.name, () => runSample(meta, VerifyPhone, "phone"), 20000);
