import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import { ErrorsApp } from "./errors/app/ErrorsApp";
import { account, createSessionApi } from "./errors/mocks/session-api";
import meta from "./Errors.samples";

type Sample = SampleOf<typeof meta>;

const VerifyRestricted: Sample = {
  name: "권한 요청을 보내면 보냄 상태로 바뀜 검증",
  render: () => <ErrorsApp api={createSessionApi({ delay: 50 })} initialPath="/docs/plan" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(page.getByText("이 문서를 볼 권한이 없습니다")).toBeVisible());
    await userEvent.click(page.getByRole("button", { name: "권한 요청하기" }));
    await waitFor(() => expect(page.getByText("권한 요청을 보냈습니다. 승인되면 알려 드립니다.")).toBeVisible());
    await expect(page.queryByRole("button", { name: "권한 요청하기" })).toBeNull();
  },
};

const VerifyMissingAndMaintenance: Sample = {
  name: "없는 페이지는 셸 안에서 돌아갈 곳을 줌 검증",
  render: () => <ErrorsApp api={createSessionApi({ delay: 50, retriesUntilUp: 2 })} initialPath="/archive/2024" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(page.getByText("페이지를 찾을 수 없습니다")).toBeVisible());
    await expect(page.getAllByRole("link", { name: "설계 문서" }).length).toBeGreaterThan(0);
    await userEvent.click(page.getByRole("link", { name: "메모 쓰기로" }));
    await waitFor(() => expect(page.getByLabelText("제목")).toBeVisible());
  },
};

const VerifyMaintenance: Sample = {
  name: "점검 중 다시 시도 검증",
  render: () => <ErrorsApp api={createSessionApi({ delay: 50, retriesUntilUp: 2 })} initialPath="/maintenance" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(page.getByText("점검 중입니다")).toBeVisible());
    // 셸이 없다.
    await expect(page.queryByRole("link", { name: "설계 문서" })).toBeNull();
    await userEvent.click(page.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(page.getByText("아직 점검 중입니다.")).toBeVisible());
    await userEvent.click(page.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(page.getByLabelText("제목")).toBeVisible());
  },
};

const VerifyExpiredStart: Sample = {
  name: "만료로 시작하면 대화상자가 뜨고 로그인해도 화면이 유지됨 검증",
  render: () => <ErrorsApp api={createSessionApi({ delay: 50, isExpired: true })} initialPath="/notes/new" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("alertdialog", { name: "다시 로그인해 주세요" });
    await waitFor(() => expect(dialog).toBeVisible());
    // 틀린 비밀번호는 대화상자 안에서 알린다.
    await userEvent.type(within(dialog).getByLabelText("비밀번호"), "wrong-value");
    await userEvent.click(within(dialog).getByRole("button", { name: "로그인" }));
    await expect(await within(dialog).findByText("비밀번호가 맞지 않습니다.")).toBeInTheDocument();
    await userEvent.clear(within(dialog).getByLabelText("비밀번호"));
    await userEvent.type(within(dialog).getByLabelText("비밀번호"), account.secret);
    await userEvent.click(within(dialog).getByRole("button", { name: "로그인" }));
    await waitFor(() => expect(page.queryByRole("alertdialog")).toBeNull());
    await expect(page.getByLabelText("제목")).toHaveValue("분기 회고");
  },
};

const expiring = createSessionApi({ delay: 50 });
const VerifyExpireOnSave: Sample = {
  name: "저장 중 만료되면 다시 로그인 뒤 같은 저장이 이어짐 검증",
  render: () => <ErrorsApp api={expiring} initialPath="/notes/new" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.type(await page.findByLabelText("본문"), " 마지막 문장");
    expiring.expire();
    await userEvent.click(page.getByRole("button", { name: "저장" }));
    const dialog = await page.findByRole("alertdialog", { name: "다시 로그인해 주세요" });
    await userEvent.type(within(dialog).getByLabelText("비밀번호"), account.secret);
    await userEvent.click(within(dialog).getByRole("button", { name: "로그인" }));
    await waitFor(() => expect(page.queryByRole("alertdialog")).toBeNull());
    // 대화상자 뒤의 입력은 그대로이고, 끊겼던 저장이 이어져 끝난다.
    expect((page.getByLabelText("본문") as HTMLTextAreaElement).value).toContain("마지막 문장");
    await waitFor(() => expect(page.getByText("저장됨")).toBeVisible());
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 권한 없음 검증",
  render: () => <ErrorsApp api={createSessionApi({ delay: 50 })} initialPath="/docs/plan" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(page.getByText("이 문서를 볼 권한이 없습니다")).toBeVisible());
    await userEvent.click(page.getByRole("button", { name: "권한 요청하기" }));
    await waitFor(() => expect(page.getByText("권한 요청을 보냈습니다. 승인되면 알려 드립니다.")).toBeVisible());
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};

test(VerifyRestricted.name, () => runSample(meta, VerifyRestricted));
test(VerifyMissingAndMaintenance.name, () => runSample(meta, VerifyMissingAndMaintenance));
test(VerifyMaintenance.name, () => runSample(meta, VerifyMaintenance));
test(VerifyExpiredStart.name, () => runSample(meta, VerifyExpiredStart));
test(VerifyExpireOnSave.name, () => runSample(meta, VerifyExpireOnSave));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone, "phone"));
