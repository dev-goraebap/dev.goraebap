import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta from "./Calendar.samples";

type Sample = SampleOf<typeof meta>;

const VerifyCreate: Sample = {
  name: "날짜 칸으로 일정 만들기 검증",
  args: { initialPath: "/calendar" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "11월 21일 (토) 일정 만들기" }));
    const dialog = await page.findByRole("dialog", { name: "일정 만들기" });
    // 빈 제목으로 제출하면 칸 곁에 알리고 대화상자를 닫지 않는다.
    await userEvent.click(within(dialog).getByRole("button", { name: "추가" }));
    await waitFor(() => expect(within(dialog).getByRole("textbox", { name: /제목/ })).toHaveAttribute("aria-invalid", "true"));
    await userEvent.type(within(dialog).getByRole("textbox", { name: /제목/ }), "치과 예약");
    await userEvent.click(within(dialog).getByRole("button", { name: "추가" }));
    await expect(await page.findByRole("button", { name: "치과 예약, 11월 21일 (토) · 종일" })).toBeVisible();
  },
};

const VerifyOverflow: Sample = {
  name: "넘치는 일정 묶기와 주소 검증",
  args: { initialPath: "/calendar" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "+3개 더 보기, 11월 12일 (목)" }));
    await userEvent.click(await page.findByRole("button", { name: /저녁 모임/ }));
    // 고른 일정은 그 날의 주 보기에서 열린다.
    const edit = await page.findByRole("button", { name: "수정" });
    // 팝오버·시트가 열리는 동안에는 아직 보이지 않는다.
    await waitFor(() => expect(edit).toBeVisible());
    // 보기는 탭이다: 주 보기가 골라져 있고, 월을 누르면 월 보기로 돌아간다.
    await expect(page.getByRole("tab", { name: "주", selected: true })).toBeVisible();
    await userEvent.click(page.getByRole("tab", { name: "월" }));
    await waitFor(() => expect(page.getByRole("tab", { name: "월", selected: true })).toBeVisible());
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 날짜 목록·바텀시트 검증",
  args: { initialPath: "/calendar" },
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "11월 12일 (목), 일정 6개" }));
    await userEvent.click(await page.findByRole("button", { name: /^고객 인터뷰/ }));
    const edit = await page.findByRole("button", { name: "수정" });
    // 팝오버·시트가 열리는 동안에는 아직 보이지 않는다.
    await waitFor(() => expect(edit).toBeVisible());
  },
};

test(VerifyCreate.name, () => runSample(meta, VerifyCreate), 20000);
test(VerifyOverflow.name, () => runSample(meta, VerifyOverflow), 20000);
test(VerifyPhone.name, () => runSample(meta, VerifyPhone), 20000);
