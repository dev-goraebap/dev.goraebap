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
    await userEvent.click(await page.findByRole("menuitem", { name: /저녁 모임/ }));
    // 고른 일정은 요약 팝오버 없이 격자 위 상세 대화상자로 열린다(Routed Modal). 격자는 그대로 월 보기다.
    const dialog = await page.findByRole("dialog");
    await expect(await within(dialog).findByRole("heading", { name: /저녁 모임/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: "월", selected: true, hidden: true })).toBeInTheDocument();
    // 상세에서 수정으로 넘어가면 같은 자리의 대화상자가 양식으로 바뀐다.
    await userEvent.click(within(dialog).getByRole("button", { name: "수정" }));
    await expect(await page.findByRole("textbox", { name: /제목/ })).toBeVisible();
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
