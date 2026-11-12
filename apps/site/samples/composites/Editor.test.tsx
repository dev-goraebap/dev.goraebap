import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, { Reading, Writing } from "./Editor.samples";

type Sample = SampleOf<typeof meta>;
const body = (root: HTMLElement) => root.querySelector<HTMLElement>(".ProseMirror")!;
const topLevel = (root: HTMLElement) => [...body(root).children].map(each => each.textContent ?? "");
/** 본문 안의 글 한 덩이를 고른다(서식 도구가 뜨게). */
async function pick(element: Element) {
  await userEvent.tripleClick(element);
  await waitFor(() => expect(element.ownerDocument.getSelection()?.toString().length).toBeGreaterThan(0));
}

const VerifyBlockMenu: Sample = {
  name: "블록 메뉴와 단축키 검증",
  render: () => <Writing />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(page.getAllByRole("button", { name: /번 블록 선택$/ }).length).toBeGreaterThan(5));
    const before = topLevel(canvasElement).filter(text => text.startsWith("이 본문은")).length;
    await userEvent.click(page.getByRole("button", { name: "1번 블록 선택" }));
    const menu = await page.findByRole("menu", { name: "블록 메뉴" });
    for (const name of ["색", "종류 바꾸기", "서식 지우기", "복제", "복사", "링크 복사", "위로 옮기기", "아래로 옮기기", "삭제"])
      // 단축키 표기(Ctrl D · Alt ↓ · Del)가 이름 뒤에 붙는다.
      await expect(within(menu).getByRole("menuitem", { name: new RegExp(`^${name}( |$)`) })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("menu", { name: "블록 메뉴" })).not.toBeInTheDocument());
    // 단축키는 블록을 고른 채(메뉴 없이) 쓴다: Ctrl+누르기로 고르고 Ctrl+D는 복제, Alt+↓는 아래로 옮기기, Delete는 지우기.
    // 메뉴 안의 키는 메뉴가 다루므로 메뉴가 열린 동안에는 단축키가 돌지 않는다. Esc는 고른 것을 푼다.
    const choose = async (name: string) => {
      await userEvent.keyboard("{Escape}");
      const user = userEvent.setup();
      await user.keyboard("{Control>}");
      await user.click(page.getByRole("button", { name }));
      await user.keyboard("{/Control}");
      await waitFor(() => expect(page.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true"));
      // 손잡이는 블록 메뉴를 여는 단추라 초점이 그 위에 있으면 ↓를 메뉴가 가져간다(키트에 알린 문제). 초점을 본문 밖으로 둔다.
      page.getByRole("button", { name }).blur();
    };
    const grips = () => page.getAllByRole("button", { name: /번 블록 선택$/ }).length;
    const gripsBefore = grips();
    await choose("1번 블록 선택");
    await userEvent.keyboard("{Control>}d{/Control}");
    await waitFor(() => expect(topLevel(canvasElement).filter(text => text.startsWith("이 본문은")).length).toBe(before + 1));
    // 손잡이는 본문을 다시 잰 뒤 늘어난다. 그 전의 2번은 아직 옛 블록이다.
    await waitFor(() => expect(grips()).toBe(gripsBefore + 1));
    // 복제본(2번)을 아래로 옮기면 다음 제목과 자리를 바꾼다.
    await choose("2번 블록 선택");
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await waitFor(() => expect(topLevel(canvasElement)[1]).toBe("분기 지표"));
    await choose("3번 블록 선택");
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(topLevel(canvasElement).filter(text => text.startsWith("이 본문은")).length).toBe(before));
    await userEvent.keyboard("{Escape}");
    // 하위 메뉴: 종류 바꾸기로 제목 3을 고른다.
    await userEvent.click(page.getByRole("button", { name: "1번 블록 선택" }));
    const again = await page.findByRole("menu", { name: "블록 메뉴" });
    await userEvent.click(within(again).getByRole("menuitem", { name: "종류 바꾸기" }));
    await userEvent.click(within(await page.findByRole("menu", { name: "종류 바꾸기" })).getByRole("menuitem", { name: "제목 3" }));
    await waitFor(() => expect(body(canvasElement).firstElementChild?.tagName).toBe("H3"));
  },
};

const VerifyUploadZone: Sample = {
  name: "/ 명령과 올리는 칸 열기·닫기·놓기 검증",
  render: () => <Writing value={{ type: "doc", content: [{ type: "paragraph" }] }} />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const editor = await waitFor(() => { const found = body(canvasElement); expect(found).toBeTruthy(); return found; });
    await userEvent.click(editor);
    await userEvent.keyboard("/file");
    const palette = await page.findByRole("dialog", { name: "블록 추가 메뉴" });
    await expect(within(palette).getByRole("button", { name: /이미지 · 동영상/ })).toBeVisible();
    await userEvent.keyboard("{Enter}");
    const zone = await page.findByRole("group", { name: "파일 올리는 칸" });
    // 칸은 화면 표시라 문서에 남지 않는다. ✕로 닫는다.
    await expect(editor.querySelector("p")?.textContent).toBe("");
    await userEvent.click(within(zone).getByRole("button", { name: "올리는 칸 닫기" }));
    await waitFor(() => expect(page.queryByRole("group", { name: "파일 올리는 칸" })).not.toBeInTheDocument());
    // HTML 칸은 Esc로 닫는다.
    await userEvent.keyboard("/html{Enter}");
    const html = await page.findByRole("group", { name: "HTML 파일 올리는 칸" });
    await expect(within(html).getByText("HTML 파일을 눌러서 올리기")).toBeInTheDocument();
    within(html).getAllByRole("button")[0].focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("group", { name: "HTML 파일 올리는 칸" })).not.toBeInTheDocument());
    // 칸에 파일을 놓으면 올리기가 시작되고 칸이 닫힌 뒤 그 자리에 파일 카드가 들어간다.
    await userEvent.keyboard("/file{Enter}");
    const target = await page.findByRole("group", { name: "파일 올리는 칸" });
    const transfer = new DataTransfer();
    transfer.items.add(new File(["안녕"], "회의 메모.pdf", { type: "application/pdf" }));
    target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    await waitFor(() => expect(page.queryByRole("group", { name: "파일 올리는 칸" })).not.toBeInTheDocument());
    await expect(await page.findByRole("region", { name: "파일 업로드" })).toBeVisible();
    await waitFor(() => expect(body(canvasElement).textContent).toContain("회의 메모.pdf"), { timeout: 4000 });
  },
};

const VerifyLinkPanel: Sample = {
  name: "선택 서식 도구와 링크 입력 칸 검증",
  render: () => <Writing />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const heading = await waitFor(() => { const found = body(canvasElement).querySelector("h2"); expect(found).toBeTruthy(); return found!; });
    await pick(heading);
    const toolbar = await page.findByRole("toolbar", { name: "선택 텍스트 서식" });
    for (const name of ["블록 종류", "굵게", "기울임", "밑줄", "취소선", "인라인 코드", "링크", "색", "더 보기"]) await expect(within(toolbar).getByRole("button", { name })).toBeInTheDocument();
    await userEvent.click(within(toolbar).getByRole("button", { name: "굵게" }));
    await waitFor(() => expect(heading.querySelector("strong")).not.toBeNull());
    // 링크: 문서 이름으로 찾아 고르면 앱 안의 주소로 걸린다.
    await userEvent.click(within(toolbar).getByRole("button", { name: "링크" }));
    const panel = await page.findByRole("dialog", { name: "링크" });
    await userEvent.type(within(panel).getByRole("textbox", { name: "링크 주소 또는 문서 이름" }), "배포");
    await userEvent.click(await within(panel).findByRole("button", { name: /배포 절차/ }));
    await waitFor(() => expect(heading.querySelector("a")?.getAttribute("href")).toBe("/documents/release"));
    // 주소는 https://를 붙여 건다.
    await pick(body(canvasElement).querySelectorAll("h2")[1]);
    await userEvent.click(within(await page.findByRole("toolbar", { name: "선택 텍스트 서식" })).getByRole("button", { name: "링크" }));
    const address = within(await page.findByRole("dialog", { name: "링크" })).getByRole("textbox", { name: "링크 주소 또는 문서 이름" });
    await userEvent.type(address, "example.com{Enter}");
    await waitFor(() => expect(body(canvasElement).querySelectorAll("h2")[1].querySelector("a")?.getAttribute("href")).toBe("https://example.com"));
  },
};

const VerifyTable: Sample = {
  name: "표 손잡이와 표 메뉴 검증",
  render: () => <Writing />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const table = await waitFor(() => { const found = body(canvasElement).querySelector("table"); expect(found).toBeTruthy(); return found!; });
    const rows = () => table.querySelectorAll("tr").length;
    const start = rows();
    await userEvent.click(table.querySelectorAll("td")[0]);
    await userEvent.click(await page.findByRole("button", { name: "행 메뉴" }));
    const menu = await page.findByRole("menu", { name: "행 메뉴" });
    for (const name of ["위에 행 추가", "아래에 행 추가", "위로 옮기기", "아래로 옮기기", "머리글 행 켜기 · 끄기", "행 삭제"]) await expect(within(menu).getByRole("menuitem", { name })).toBeInTheDocument();
    await userEvent.click(within(menu).getByRole("menuitem", { name: "아래에 행 추가" }));
    await waitFor(() => expect(rows()).toBe(start + 1));
    // 끝에 열을 더하는 + 막대, 열 메뉴의 Esc 닫기.
    const columns = table.querySelectorAll("tr")[0].children.length;
    await userEvent.click(page.getByRole("button", { name: "끝에 열 추가" }));
    await waitFor(() => expect(table.querySelectorAll("tr")[0].children.length).toBe(columns + 1));
    await userEvent.click(table.querySelectorAll("td")[0]);
    await userEvent.click(await page.findByRole("button", { name: "열 메뉴" }));
    await page.findByRole("menu", { name: "열 메뉴" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("menu", { name: "열 메뉴" })).not.toBeInTheDocument());
  },
};

const VerifyReading: Sample = {
  name: "읽는 본문: 앱 안 링크·링크 카드·HTML 크게 보기 검증",
  render: () => <Reading />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const article = await page.findByRole("article", { name: "본문" });
    await expect(page.queryByRole("button", { name: /번 블록 선택$/ })).not.toBeInTheDocument();
    await userEvent.click(within(article).getByRole("link", { name: "화면 규칙 검토 메모" }));
    await expect(await page.findByText("이동: /documents/screen-rules")).toBeVisible();
    // 링크 카드: 미리보기가 오면 제목, 사진이 없으면 빈 사진 칸. 카드 전체가 새 탭 링크다.
    const card = await within(article).findByRole("link", { name: /읽기 편한 화면을 만드는 열 가지 기준/ });
    await expect(card).toHaveAttribute("target", "_blank");
    await expect(await within(article).findByText("대표 이미지가 없습니다")).toBeVisible();
    // HTML 임베드: 격리된 틀로 미리 보고, 크게 보기는 창을 거의 채우는 대화상자. blob 주소는 새 탭으로 열지 않는다.
    const frame = article.querySelector("iframe")!;
    await expect(frame.getAttribute("sandbox")).toBe("allow-scripts allow-modals allow-forms allow-popups");
    await expect(frame.getAttribute("referrerpolicy")).toBe("no-referrer");
    await userEvent.click(within(article).getByRole("button", { name: "분기 지표.html 크게 보기" }));
    const viewer = await page.findByRole("dialog", { name: /^분기 지표\.html/ });
    await expect(within(viewer).queryByRole("button", { name: "새 탭에서 열기" })).not.toBeInTheDocument();
    await userEvent.click(within(viewer).getByRole("button", { name: "닫기" }));
    await waitFor(() => expect(page.queryByRole("dialog", { name: /^분기 지표\.html/ })).not.toBeInTheDocument());
  },
};

test(VerifyBlockMenu.name, () => runSample(meta, VerifyBlockMenu), 20000);
test(VerifyUploadZone.name, () => runSample(meta, VerifyUploadZone), 20000);
test(VerifyLinkPanel.name, () => runSample(meta, VerifyLinkPanel), 20000);
test(VerifyTable.name, () => runSample(meta, VerifyTable), 20000);
test(VerifyReading.name, () => runSample(meta, VerifyReading), 20000);
