import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import type { NavSpace } from "@/shared/ui/app-shell";
import { FolderIcon, HomeIcon, LibraryIcon, ListFilterIcon, StarIcon } from "@/shared/ui/icon";
import meta, * as samples from "./AppShell.samples";

type Sample = SampleOf<typeof meta>;

/** 데스크톱 사이드바. 키트 사이드바는 nav가 아니라 이름 붙은 면이라 data-slot으로 찾는다. */
const sidebarOf = async (canvasElement: HTMLElement) => {
  const body = within(canvasElement.ownerDocument.body);
  await body.findByRole("button", { name: "사이드바 접기" });
  return within(canvasElement.ownerDocument.querySelector<HTMLElement>("[data-slot=sidebar]")!);
};

const VerifySidebar: Sample = {
  name: "사이드바 접기·초점 검증",
  render: () => <samples.Shell />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    // 접기와 펼치기는 같은 단추이므로 초점이 그 자리에 남는다.
    await userEvent.click(await page.findByRole("button", { name: "사이드바 접기" }));
    const expand = await page.findByRole("button", { name: "사이드바 펼치기" });
    await waitFor(() => expect(expand).toHaveFocus());
    await userEvent.click(expand);
    await waitFor(() => expect(page.getByRole("button", { name: "사이드바 접기" })).toHaveFocus());
    const sidebar = await sidebarOf(canvasElement);
    await userEvent.click(sidebar.getByRole("link", { name: "일정" }));
    await waitFor(() => expect(sidebar.getByRole("link", { name: "일정" })).toHaveAttribute("aria-current", "page"));
  },
};

const VerifyPhoneTabs: Sample = {
  name: "휴대폰 탭·더보기 검증",
  render: () => <samples.Shell />,
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const tabs = await page.findByRole("navigation", { name: "주 메뉴" });
    await expect(within(tabs).getByRole("link", { name: "모든 항목" })).toHaveAttribute("aria-current", "page");
    // 만들기는 하단 탭 위의 FAB다(시트가 열리면 뒤가 가려지므로 먼저 본다).
    await expect(page.getByRole("button", { name: "항목 추가" })).toBeVisible();
    // 휴대폰의 누름 자리: 탭과 더보기 줄은 44px 이상이다.
    await expect(within(tabs).getByRole("link", { name: "모든 항목" }).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await userEvent.click(within(tabs).getByRole("button", { name: "더보기" }));
    const sheet = await page.findByRole("dialog", { name: "더보기" });
    await waitFor(() => expect(within(sheet).getByRole("link", { name: "설정" })).toBeVisible());
    await expect(within(sheet).getByRole("link", { name: "설정" }).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

const nestedSpace: NavSpace = { id: "main", title: "문서", sections: [{ title: "문서", isHeaderHidden: true, entries: [
  { path: "/a", label: "첫째", icon: HomeIcon }, { path: "/b", label: "둘째", icon: FolderIcon }, { path: "/c", label: "셋째", icon: StarIcon },
  { path: "/d", label: "넷째", icon: LibraryIcon, children: [{ path: "/d/1", label: "넷째 하위" }] },
  { path: "/e", label: "다섯째", icon: ListFilterIcon, children: [{ path: "/e/1", label: "다섯째 하위 1" }, { path: "/e/2", label: "다섯째 하위 2" }] },
] }] };

const VerifyNestedMore: Sample = {
  name: "더보기 하위 메뉴 묶음 검증",
  render: () => <samples.Shell space={nestedSpace} />,
  device: "phone", path: "/b",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "더보기" }));
    const sheet = await page.findByRole("dialog", { name: "더보기" });
    const parent = within(sheet).getByRole("link", { name: "다섯째" });
    const child = within(sheet).getByRole("link", { name: "다섯째 하위 1" });
    // 탭에 있는 상위(넷째)도 남은 하위가 있으면 묶음 머리로 보이고, 하위는 상위의 묶음 안에 놓인다.
    await waitFor(() => expect(within(sheet).getByRole("link", { name: "넷째" })).toBeVisible());
    await expect(parent.closest("li")).toContainElement(child);
    // 하위 글자는 상위 아이콘 뒤 글자 시작선에 맞춘다(시트가 다 올라온 뒤에 잰다).
    const textLeft = (link: HTMLElement) => link.querySelector("span")!.getBoundingClientRect().left;
    await waitFor(() => expect(Math.abs(textLeft(child) - textLeft(parent))).toBeLessThan(1));
    // 묶음 사이에 선과 간격이 있다.
    await expect(getComputedStyle(parent.closest("li")!).borderBlockStartWidth).toBe("1px");
  },
};

/*
 * 사이드바 하위 메뉴 간격(design-system/references/app-layout.md): 하위 줄도 상위 줄끼리와 같은 2px로 띄우고,
 * 펼친 묶음 끝에는 8px를 더한다(키트 SidebarMenuSub).
 */
const VerifyNestedSidebar: Sample = {
  name: "사이드바 하위 메뉴 간격 검증",
  render: () => <samples.Shell space={nestedSpace} />,
  path: "/b",
  play: async ({ canvasElement }) => {
    const nav = await sidebarOf(canvasElement);
    const box = (name: string) => nav.getByRole("link", { name }).getBoundingClientRect();
    const sibling = box("둘째").top - box("첫째").bottom;
    await expect(box("다섯째 하위 1").top - box("다섯째").bottom).toBeCloseTo(sibling, 0);
    await expect(box("다섯째 하위 2").top - box("다섯째 하위 1").bottom).toBeCloseTo(sibling, 0);
    await expect(box("다섯째").top - box("넷째 하위").bottom).toBeGreaterThan(sibling + 4);
  },
};

const VerifyCurrentGroupOpen: Sample = {
  name: "현재 묶음만 펼치기 검증",
  render: () => <samples.Shell space={nestedSpace} openGroups="current" />,
  path: "/b",
  play: async ({ canvasElement }) => {
    const nav = await sidebarOf(canvasElement);
    // 처음에는 현재 위치(둘째)가 묶음 밖이라 하위 묶음이 모두 접혀 있다.
    await expect(nav.queryByRole("link", { name: "넷째 하위" })).toBeNull();
    // 다른 묶음의 하위로 옮겨 가면 그 묶음이 펼쳐지고 현재 항목이 보인다.
    await userEvent.click(nav.getByRole("link", { name: "다섯째" }));
    await expect(await nav.findByRole("link", { name: "다섯째 하위 1" })).toBeVisible();
    await expect(nav.queryByRole("link", { name: "넷째 하위" })).toBeNull();
  },
};

test(VerifyCurrentGroupOpen.name, () => runSample(meta, VerifyCurrentGroupOpen));
test(VerifyNestedSidebar.name, () => runSample(meta, VerifyNestedSidebar));
test(VerifyNestedMore.name, () => runSample(meta, VerifyNestedMore));
test(VerifySidebar.name, () => runSample(meta, VerifySidebar));
test(VerifyPhoneTabs.name, () => runSample(meta, VerifyPhoneTabs));
