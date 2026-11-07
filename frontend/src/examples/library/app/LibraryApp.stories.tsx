import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { LibraryApp } from "./LibraryApp";
import { createResourceApi } from "../mocks/resource-api";
const meta = {
  title: "예제/서가",
  id: "example-library",
  component: LibraryApp,
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "desktop", isRotated: false } },
  argTypes: {
    api: { table: { disable: true } },
    initialTheme: { table: { disable: true } },
    initialPath: { name: "시작 주소" },
    initialLayout: {
      name: "레이아웃",
      control: "inline-radio",
      options: ["inset", "split"],
    },
  },
  render: (args, context) => (
    <LibraryApp
      key={`${context.globals.theme}-${args.initialPath}-${args.initialLayout}`}
      {...args}
      initialTheme={context.globals.theme === "dark" ? "dark" : "light"}
      api={createResourceApi({ delay: 60 })}
    />
  ),
} satisfies Meta<typeof LibraryApp>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Library: Story = {
  name: "모든 자료",
  args: { initialPath: "/resources" },
};
export const VerifySidebar: Story = {
  name: "사이드바 조절·접기 검증",
  args: { initialPath: "/resources" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const handle = await page.findByRole("separator", {
      name: "사이드바 너비 조절",
    });
    await expect(handle).toHaveAttribute("aria-valuenow", "340");
    await userEvent.click(handle);
    await userEvent.keyboard("{End}");
    await expect(handle).toHaveAttribute("aria-valuenow", "380");
    await userEvent.keyboard("{Home}");
    await expect(handle).toHaveAttribute("aria-valuenow", "220");
    await userEvent.click(page.getByRole("button", { name: "메뉴 접기" }));
    await expect(
      page.queryByRole("separator", { name: "사이드바 너비 조절" }),
    ).not.toBeInTheDocument();
    await expect(
      within(page.getByRole("navigation", { name: "주 탐색" })).getByRole(
        "link",
        { name: "모든 자료" },
      ),
    ).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "메뉴 펼치기" }));
    await expect(
      page.getByRole("separator", { name: "사이드바 너비 조절" }),
    ).toHaveAttribute("aria-valuenow", "220");
  },
};
export const List: Story = {
  name: "리스트",
  args: { initialPath: "/resources?view=list" },
};
export const Collection: Story = {
  name: "컬렉션",
  args: { initialPath: "/resources?collection=design" },
};
export const Split: Story = {
  name: "Split 레이아웃",
  args: { initialPath: "/resources?view=list", initialLayout: "split" },
};
export const Dark: Story = {
  name: "다크",
  args: { initialPath: "/resources" },
  globals: { theme: "dark" },
};
export const Detail: Story = {
  name: "상세 직접 진입",
  args: { initialPath: "/resources/design-tokens" },
};
export const Create: Story = {
  name: "등록 페이지",
  args: { initialPath: "/resources/new" },
};
export const Mobile: Story = {
  name: "모바일",
  args: { initialPath: "/resources" },
  globals: { viewport: { value: "iphone14", isRotated: false } },
};
export const Empty: Story = {
  name: "빈 라이브러리",
  render: () => (
    <LibraryApp
      api={createResourceApi({ initial: [], delay: 0 })}
      initialPath="/resources"
    />
  ),
};
export const Error: Story = {
  name: "조회 실패",
  render: () => (
    <LibraryApp
      api={createResourceApi({ fail: true, delay: 0 })}
      initialPath="/resources"
    />
  ),
};
export const Loading: Story = {
  name: "데이터 대기",
  render: () => (
    <LibraryApp
      api={createResourceApi({ delay: 60_000 })}
      initialPath="/resources"
    />
  ),
};
export const VerifyNavigation: Story = {
  name: "상세 닫기·검색 복귀 검증",
  args: { initialPath: "/resources?view=list&q=주소" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await page.findByRole("link", { name: "주소에 남겨야 하는 화면 상태" }),
    );
    await waitFor(() => expect(page.getByRole("dialog")).toBeVisible());
    await waitFor(() =>
      expect(
        within(page.getByRole("dialog")).getByRole("heading", {
          name: "주소에 남겨야 하는 화면 상태",
        }),
      ).toBeVisible(),
    );
    const detailTitle = within(page.getByRole("dialog")).getByRole("heading", {
      name: "주소에 남겨야 하는 화면 상태",
    });
    await expect(detailTitle.getBoundingClientRect().width).toBeGreaterThan(
      page.getByRole("dialog").getBoundingClientRect().width / 2,
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(page.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await expect(page.getByRole("textbox", { name: "자료 검색" })).toHaveValue(
      "주소",
    );
    await expect(page.getAllByRole("article")).toHaveLength(1);
  },
};
export const VerifyJourney: Story = {
  name: "등록·확장·검색 검증",
  args: { initialPath: "/resources" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await page.findByRole("button", { name: "자료 추가" }),
    );
    await userEvent.type(
      await page.findByRole("textbox", { name: "제목" }),
      "접근성 검토 기록",
    );
    await userEvent.click(page.getByRole("button", { name: /컬렉션 · 필수/ }));
    await userEvent.click(
      await page.findByRole("menuitem", { name: "읽을거리" }),
    );
    await userEvent.click(page.getByRole("textbox", { name: "본문" }));
    await userEvent.paste("키보드로 이동하고 다시 읽어볼 내용을 남깁니다.");
    await userEvent.click(page.getByRole("button", { name: "페이지로 보기" }));
    await expect(page.getByRole("textbox", { name: "제목" })).toHaveValue(
      "접근성 검토 기록",
    );
    await expect(page.getByRole("textbox", { name: "본문" })).toHaveTextContent(
      "키보드로 이동",
    );
    await userEvent.click(page.getByRole("button", { name: "추가하기" }));
    await expect(
      await page.findByRole("heading", { name: "접근성 검토 기록" }),
    ).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "자료 목록으로" }));
    await userEvent.click(page.getByRole("button", { name: "검색" }));
    await userEvent.type(
      page.getByRole("textbox", { name: "자료 검색" }),
      "접근성 검토",
    );
    await expect(
      await page.findByRole("link", { name: "접근성 검토 기록" }),
    ).toBeVisible();
    await waitFor(() => expect(page.getAllByRole("article")).toHaveLength(1));
  },
};

export const Filtered: Story = {
  name: "작성자 필터",
  args: { initialPath: "/resources?author=서윤&view=list" },
};
export const NoResults: Story = {
  name: "검색 결과 없음",
  args: { initialPath: "/resources?q=없는검색어" },
};

export const VerifySearchAndDisplay: Story = {
  name: "검색 보존·표시 초기화 검증",
  args: { initialPath: "/resources?q=주소" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const search = await page.findByRole("textbox", { name: "자료 검색" });
    await userEvent.click(search);
    await userEvent.keyboard("{Escape}");
    await expect(
      page.queryByRole("textbox", { name: "자료 검색" }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(page.getByRole("button", { name: "검색" })).toHaveFocus(),
    );
    await userEvent.click(page.getByRole("button", { name: "검색" }));
    await expect(page.getByRole("textbox", { name: "자료 검색" })).toHaveValue(
      "주소",
    );
    await userEvent.click(page.getByRole("button", { name: "검색어 지우기" }));
    await userEvent.click(page.getByRole("button", { name: "검색 닫기" }));
    await userEvent.click(page.getByRole("button", { name: "표시" }));
    await userEvent.click(
      await page.findByRole("menuitem", { name: "리스트 보기" }),
    );
    await expect(
      page.queryByRole("button", { name: "모두 지우기" }),
    ).not.toBeInTheDocument();
    await expect(
      canvasElement.querySelector(".library-list"),
    ).toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "표시" }));
    await userEvent.click(
      await page.findByRole("menuitem", { name: "기본 표시로 초기화" }),
    );
    await expect(
      canvasElement.querySelector(".library-list"),
    ).not.toBeInTheDocument();
  },
};
export const VerifyDiscard: Story = {
  name: "미저장 초안 확인 검증",
  args: { initialPath: "/resources/new" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.type(
      await page.findByRole("textbox", { name: "제목" }),
      "보존할 초안",
    );
    await userEvent.click(page.getByRole("button", { name: "취소" }));
    await userEvent.click(
      await page.findByRole("button", { name: "계속 작성" }),
    );
    await expect(page.getByRole("textbox", { name: "제목" })).toHaveValue(
      "보존할 초안",
    );
    await userEvent.click(page.getByRole("button", { name: "취소" }));
    await userEvent.click(await page.findByRole("button", { name: "버리기" }));
    await expect(
      await page.findByRole("heading", { name: "모든 자료" }),
    ).toBeVisible();
  },
};
export const VerifyMobileMenu: Story = {
  name: "모바일 시트·FAB 검증",
  args: { initialPath: "/resources" },
  globals: { viewport: { value: "iphone14", isRotated: false } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("link", {
      name: "좋은 인터페이스를 만드는 작은 기준들",
    });
    await expect(
      page.queryByRole("complementary", { name: "사이드바" }),
    ).not.toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "필터" }));
    await expect(
      await page.findByRole("dialog", { name: "필터" }),
    ).toBeInTheDocument();
    await userEvent.click(await page.findByRole("button", { name: "지우" }));
    await waitFor(() =>
      expect(page.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await expect(
      page.getByRole("button", { name: "작성자 필터 해제" }),
    ).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "자료 추가" }));
    await expect(
      await page.findByRole("textbox", { name: "제목" }),
    ).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "컬렉션 · 필수" }));
    await userEvent.click(
      await page.findByRole("button", { name: "개발 자료" }),
    );
    await waitFor(() =>
      expect(page.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await expect(page.getByRole("button", { name: "개발 자료" })).toBeVisible();
  },
};
