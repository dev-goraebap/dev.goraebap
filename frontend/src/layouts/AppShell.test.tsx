import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import type { NavSpace } from "@kit/layouts/app/nav";
import meta, * as samples from "./AppShell.samples";

type Sample = SampleOf<typeof meta>;
const VerifySidebar: Sample = {
  name: "사이드바 접기·초점 검증",
  render: () => <samples.Shell />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "메뉴 접기" }));
    const expand = await page.findByRole("button", { name: "메뉴 펼치기" });
    await waitFor(() => expect(expand).toHaveFocus());
    await userEvent.click(expand);
    await waitFor(() => expect(page.getByRole("button", { name: "메뉴 접기" })).toHaveFocus());
    await userEvent.click(page.getByRole("link", { name: "일정" }));
    await expect(page.getByRole("link", { name: "일정" })).toHaveAttribute("aria-current", "page");
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
    await userEvent.click(within(tabs).getByRole("button", { name: "더보기" }));
    const sheet = await page.findByRole("dialog", { name: "더보기" });
    await expect(within(sheet).getByRole("link", { name: "설정" })).toBeVisible();
    await expect(page.getByRole("button", { name: "항목 추가" })).toBeVisible();
  },
};

const nestedSpace: NavSpace = { id: "main", title: "문서", sections: [{ title: "문서", isHeaderHidden: true, entries: [
  { path: "/a", label: "첫째", icon: "home" }, { path: "/b", label: "둘째", icon: "folder" }, { path: "/c", label: "셋째", icon: "star" },
  { path: "/d", label: "넷째", icon: "library", children: [{ path: "/d/1", label: "넷째 하위" }] },
  { path: "/e", label: "다섯째", icon: "filter", children: [{ path: "/e/1", label: "다섯째 하위 1" }, { path: "/e/2", label: "다섯째 하위 2" }] },
] }] };
const VerifyNestedMore: Sample = {
  name: "더보기 하위 메뉴 묶음 검증",
  render: () => <samples.Shell space={nestedSpace} />,
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "더보기" }));
    const sheet = await page.findByRole("dialog", { name: "더보기" });
    const parent = within(sheet).getByRole("link", { name: "다섯째" });
    const child = within(sheet).getByRole("link", { name: "다섯째 하위 1" });
    // 탭에 있는 상위(넷째)도 남은 하위가 있으면 묶음 머리로 보이고, 하위는 상위의 묶음 안에 놓인다.
    await expect(within(sheet).getByRole("link", { name: "넷째" })).toBeVisible();
    await expect(parent.closest("li")).toContainElement(child);
    // 하위 글자는 상위 아이콘 뒤 글자 시작선에 맞춘다.
    const textLeft = (link: HTMLElement) => link.querySelector("span, p, div")!.getBoundingClientRect().left;
    await expect(Math.abs(textLeft(child) - textLeft(parent))).toBeLessThan(1);
    // 묶음 사이에 선과 간격이 있다.
    await expect(getComputedStyle(parent.closest("li")!).borderBlockStartWidth).toBe("1px");
  },
};

const VerifyNestedSidebar: Sample = {
  name: "사이드바 하위 메뉴 간격 검증",
  render: () => <samples.Shell space={nestedSpace} />,
  play: async ({ canvasElement }) => {
    const nav = within(await within(canvasElement.ownerDocument.body).findByRole("navigation", { name: "주 메뉴" }));
    const top = (name: string) => nav.getByRole("link", { name }).getBoundingClientRect();
    // 상위 항목 사이와 같은 2px로 하위 항목을 띄우고, 펼친 묶음 끝에는 더 넓은 간격을 둔다.
    const sibling = top("둘째").top - top("첫째").bottom;
    await expect(top("다섯째 하위 1").top - top("다섯째").bottom).toBeCloseTo(sibling, 0);
    await expect(top("다섯째 하위 2").top - top("다섯째 하위 1").bottom).toBeCloseTo(sibling, 0);
    await expect(top("다섯째").top - top("넷째 하위").bottom).toBeGreaterThan(sibling + 4);
  },
};

test(VerifyNestedSidebar.name, () => runSample(meta, VerifyNestedSidebar));
test(VerifyNestedMore.name, () => runSample(meta, VerifyNestedMore));
test(VerifySidebar.name, () => runSample(meta, VerifySidebar));
test(VerifyPhoneTabs.name, () => runSample(meta, VerifyPhoneTabs));
