import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta, * as samples from "./Approval.samples";

type Sample = SampleOf<typeof meta>;
void samples;

/** 팝오버가 막 열리는 동안에는 안의 단추가 아직 눌리지 않는다(pointer-events: none). 눌릴 수 있게 된 뒤에 누른다. */
async function press(element: HTMLElement) {
  await waitFor(() => expect(getComputedStyle(element).pointerEvents).not.toBe("none"));
  await userEvent.click(element);
}

const VerifyRequest: Sample = {
  name: "단계형 신청·결재선 편집·제출 검증",
  args: { initialPath: "/requests/new" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    // 첫 단계: 빈 채로 다음을 누르면 칸 곁에 알리고 단계는 그대로다. 버튼은 막혀 있지 않다.
    await userEvent.click(await page.findByRole("button", { name: "다음" }));
    await expect(await page.findByText("시작일과 종료일을 정해 주세요.")).toBeVisible();
    await expect(page.getAllByText("사유를 입력해 주세요.").length).toBeGreaterThan(0);
    await userEvent.click(page.getByRole("button", { name: /^시작일/ }));
    await press(await page.findByRole("button", { name: "내일" }));
    await waitFor(() => expect(page.getByRole("button", { name: /^시작일/ })).toHaveTextContent("11월 9일"));
    await userEvent.click(await page.findByRole("button", { name: /^종료일/ }));
    await press(await page.findByRole("button", { name: "다음 주" }));
    await waitFor(() => expect(page.getByRole("button", { name: /^종료일/ })).toHaveTextContent("11월 15일"));
    await userEvent.type(page.getByRole("textbox", { name: "사유" }), "가족 행사로 쉽니다.");
    await userEvent.click(page.getByRole("button", { name: "다음" }));
    // 결재선 단계: 기본 결재선에서 한 명을 빼고 이름으로 찾아 더한다.
    const line = await page.findByRole("list", { name: "결재선" });
    await expect(within(line).getByText("신청자")).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "도현 빼기" }));
    await userEvent.click(page.getByRole("button", { name: "결재자 추가" }));
    // 고르는 목록은 이름으로 찾는다(찾기 칸 · 고를 것은 option).
    await userEvent.type(await page.findByPlaceholderText("이름으로 찾기"), "하은");
    await userEvent.click(await page.findByRole("option", { name: /하은/ }));
    await expect(within(line).getAllByText("하은")[0]).toBeVisible();
    // 손잡이에 초점을 두고 Alt + ↑로 한 칸 올린다.
    const grip = page.getByRole("button", { name: "하은 결재자 순서 바꾸기" });
    grip.focus();
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await waitFor(() => expect(within(line).getAllByRole("listitem")[1]).toHaveTextContent("하은"));
    await userEvent.click(page.getByRole("button", { name: "다음" }));
    // 확인 단계에서 제출하면 신청 상세로 간다.
    await expect(await page.findByText("가족 행사로 쉽니다.")).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "제출" }));
    await expect(await page.findByRole("heading", { level: 1, name: /연차 11월 9일/ })).toBeVisible();
    await expect(page.getByText("하은 · 인사 담당")).toBeVisible();
  },
};

const VerifyDecide: Sample = {
  name: "반려 이유 필수·승인 확인·목록에서 빠짐 검증",
  args: { initialPath: "/requests/AP-8" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "반려" }));
    const dialog = await page.findByRole("dialog", { name: "반려 이유" });
    await userEvent.click(within(dialog).getByRole("button", { name: "반려하기" }));
    await within(dialog).findByText("반려 이유를 입력해 주세요.");
    await userEvent.type(within(dialog).getByRole("textbox", { name: /이유/ }), "배포 일정과 겹칩니다.");
    await userEvent.click(within(dialog).getByRole("button", { name: "반려하기" }));
    // 대화상자 안 입력 칸의 글자가 아니라, 닫힌 뒤 상세에 남은 반려 의견을 찾는다.
    await waitFor(() => expect(page.queryByRole("dialog", { name: "반려 이유" })).not.toBeInTheDocument());
    await expect(await page.findByText("배포 일정과 겹칩니다.")).toBeVisible();
    await waitFor(() => expect(page.queryByRole("button", { name: "승인" })).not.toBeInTheDocument());
    // 다른 문서는 승인 확인 창을 거친다. 처리한 문서는 결재할 문서에서 빠진다.
    await userEvent.click(page.getAllByRole("link", { name: /결재할 문서/ })[0]);
    const inbox = await page.findByRole("list", { name: "결재할 문서" });
    await expect(within(inbox).queryByText(/민준님/)).toBeNull();
    await userEvent.click(within(inbox).getByRole("link", { name: /하은님의/ }));
    await userEvent.click(await page.findByRole("button", { name: "승인" }));
    const confirm = await page.findByRole("alertdialog", { name: "승인할까요?" });
    await userEvent.click(within(confirm).getByRole("button", { name: "승인" }));
    await waitFor(() => expect(page.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(page.queryByRole("button", { name: "승인" })).not.toBeInTheDocument());
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 결재선 단계 검증",
  args: { initialPath: "/requests/new?step=line" },
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await page.findByRole("list", { name: "결재선" });
    await expect(page.getByRole("button", { name: "다음" })).toBeVisible();
    await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await userEvent.click(page.getByRole("button", { name: "결재자 추가" }));
    await userEvent.click(await page.findByRole("option", { name: /민준/ }));
    await expect((await within(page.getByRole("list", { name: "결재선" })).findAllByText("민준"))[0]).toBeVisible();
  },
};

test(VerifyRequest.name, () => runSample(meta, VerifyRequest));
test(VerifyDecide.name, () => runSample(meta, VerifyDecide));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone));
