import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import { OnboardingApp } from "./onboarding/app/OnboardingApp";
import { createWorkspaceApi } from "./onboarding/mocks/workspace-api";
import meta from "./Onboarding.samples";

type Sample = SampleOf<typeof meta>;
const visible = (find: () => HTMLElement) => waitFor(() => expect(find()).toBeVisible());

const VerifySampleStart: Sample = {
  name: "견본으로 시작하면 목록이 생기고 되돌리면 첫 화면으로 돌아옴 검증",
  render: () => <OnboardingApp api={createWorkspaceApi({ delay: 30 })} />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "견본으로 시작" }));
    const list = await page.findByRole("list", { name: "프로젝트" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    await visible(() => page.getByText("견본 프로젝트 3개로 시작했습니다"));
    await userEvent.click(page.getByRole("button", { name: "되돌리기" }));
    await visible(() => page.getByRole("heading", { level: 2, name: "무엇부터 시작할까요?" }));
    await expect(page.queryByRole("list", { name: "프로젝트" })).toBeNull();
  },
};

const VerifyChecklist: Sample = {
  name: "체크리스트에서 마치기와 나중에 하기 검증",
  render: () => <OnboardingApp api={createWorkspaceApi({ delay: 30, seed: "progress" })} initialPath="/setup" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const steps = await page.findByRole("list", { name: "시작하기 단계" });
    await visible(() => page.getByText("3단계 중 1단계 완료"));
    const invite = within(steps).getByRole("listitem", { name: "팀원 초대하기" });
    // 형식이 틀린 이메일은 대화상자에서 막고, 맞으면 체크된다.
    await userEvent.click(within(invite).getByRole("button", { name: "초대하기" }));
    const dialog = await page.findByRole("dialog", { name: "팀원 초대하기" });
    await userEvent.type(within(dialog).getByLabelText("이메일"), "not-an-email");
    await userEvent.click(within(dialog).getByRole("button", { name: "초대하기" }));
    await waitFor(() => expect(within(dialog).getByLabelText("이메일")).toHaveAttribute("aria-invalid", "true"));
    await userEvent.clear(within(dialog).getByLabelText("이메일"));
    await userEvent.type(within(dialog).getByLabelText("이메일"), "jiwoo@example.com");
    await userEvent.click(within(dialog).getByRole("button", { name: "초대하기" }));
    await waitFor(() => expect(page.queryByRole("dialog", { name: "팀원 초대하기" })).toBeNull());
    await visible(() => page.getByText("3단계 중 2단계 완료"));
    // 나중에 하기는 진행에 세지 않고, 같은 자리에서 다시 할 수 있다.
    const notify = within(steps).getByRole("listitem", { name: "알림 켜기" });
    await userEvent.click(within(notify).getByRole("button", { name: "나중에 하기" }));
    await visible(() => within(steps).getByText("나중에 하기로 했습니다."));
    await expect(page.getByText("3단계 중 2단계 완료")).toBeInTheDocument();
    await userEvent.click(within(notify).getByRole("button", { name: "켜기" }));
    await visible(() => page.getByText("3단계 중 3단계 완료"));
    await expect(page.getByText("모든 단계를 마쳤습니다.")).toBeVisible();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 첫 화면은 선택지가 세로로 쌓임 검증",
  render: () => <OnboardingApp api={createWorkspaceApi({ delay: 30 })} />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await visible(() => page.getByRole("heading", { level: 2, name: "무엇부터 시작할까요?" }));
    const first = page.getByRole("button", { name: "견본으로 시작" });
    const second = page.getByRole("button", { name: "팀원 초대" });
    await expect(second.getBoundingClientRect().top).toBeGreaterThan(first.getBoundingClientRect().bottom - 1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    // 만들기는 첫 화면의 선택지와 휴대폰 FAB 둘 다 같은 대화상자를 연다.
    await userEvent.click(page.getAllByRole("button", { name: "프로젝트 만들기" })[0]);
    const dialog = await page.findByRole("dialog", { name: "프로젝트 만들기" });
    await userEvent.type(within(dialog).getByLabelText("이름"), "하은의 첫 프로젝트");
    await userEvent.click(within(dialog).getByRole("button", { name: "만들기" }));
    await visible(() => page.getByRole("list", { name: "프로젝트" }));
  },
};

test(VerifySampleStart.name, () => runSample(meta, VerifySampleStart));
test(VerifyChecklist.name, () => runSample(meta, VerifyChecklist), 10000);
test(VerifyPhone.name, () => runSample(meta, VerifyPhone, "phone"));
