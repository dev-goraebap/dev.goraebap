import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import { LoginApp } from "./login/app/LoginApp";
import { accounts } from "./login/mocks/auth-api";
import { createAuthApi } from "./login/mocks/auth-api";
import meta from "./Login.samples";

type Sample = SampleOf<typeof meta>;
const [account] = accounts;
const fast = () => <LoginApp api={createAuthApi({ delay: 50 })} />;

const VerifyRejectThenSignIn: Sample = {
  name: "빈 칸·자격 오류·성공 검증",
  render: fast,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    // 비어 있으면 칸 곁에 알리고 배너는 없다.
    await userEvent.click(await page.findByRole("button", { name: "로그인" }));
    await waitFor(() => expect(page.getAllByText("이메일을 입력해 주세요.")[0]).toBeVisible());
    await expect(page.getByLabelText("이메일")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabelText("비밀번호")).toHaveAttribute("aria-invalid", "true");
    await expect(page.queryByText("이메일 또는 비밀번호가 맞지 않습니다.")).toBeNull();
    // 틀린 값이면 양식 위 배너가 뜨고, 어느 칸이 틀렸는지 알리지 않으며, 입력은 남는다.
    await userEvent.type(page.getByLabelText("이메일"), account.email);
    await userEvent.type(page.getByLabelText("비밀번호"), "wrong-value");
    await userEvent.click(page.getByRole("button", { name: "로그인" }));
    await expect(await page.findByText("이메일 또는 비밀번호가 맞지 않습니다.")).toBeInTheDocument();
    await expect(page.getByLabelText("이메일")).toHaveValue(account.email);
    await expect(page.getByLabelText("비밀번호")).toHaveValue("wrong-value");
    // 맞는 값으로 다시 보내면 들어간다.
    await userEvent.clear(page.getByLabelText("비밀번호"));
    await userEvent.type(page.getByLabelText("비밀번호"), account.secret);
    await userEvent.click(page.getByRole("button", { name: "로그인" }));
    await expect(await page.findByRole("heading", { level: 1, name: `${account.name}님, 안녕하세요` })).toBeVisible();
  },
};

const VerifyToggleAndForgot: Sample = {
  name: "비밀번호 보기·비밀번호 찾기 검증",
  render: fast,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const password = await page.findByLabelText("비밀번호");
    await expect(password).toHaveAttribute("type", "password");
    await userEvent.click(page.getByRole("checkbox", { name: "비밀번호 보기" }));
    await expect(page.getByLabelText("비밀번호")).toHaveAttribute("type", "text");
    await userEvent.click(page.getByRole("link", { name: "비밀번호 찾기" }));
    await userEvent.type(await page.findByLabelText("이메일"), account.email);
    await userEvent.click(page.getByRole("button", { name: "안내 메일 보내기" }));
    await expect(await page.findByRole("heading", { level: 1, name: "메일을 보냈습니다" })).toBeVisible();
    await expect(page.getByText(/가입된 주소라면/)).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "로그인으로 돌아가기" }));
    await expect(await page.findByRole("heading", { level: 1, name: "로그인" })).toBeVisible();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰은 카드 테두리 없이 로그인 검증",
  render: fast,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const title = await page.findByRole("heading", { level: 1, name: "로그인" });
    const card = title.parentElement as HTMLElement;
    await expect(getComputedStyle(card).borderTopWidth).toBe("0px");
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await userEvent.type(page.getByLabelText("이메일"), account.email);
    await userEvent.type(page.getByLabelText("비밀번호"), account.secret);
    await userEvent.click(page.getByRole("button", { name: "로그인" }));
    await waitFor(() => expect(page.getByRole("heading", { level: 1, name: `${account.name}님, 안녕하세요` })).toBeVisible());
  },
};

test(VerifyRejectThenSignIn.name, () => runSample(meta, VerifyRejectThenSignIn));
test(VerifyToggleAndForgot.name, () => runSample(meta, VerifyToggleAndForgot));
test(VerifyPhone.name, () => runSample(meta, VerifyPhone, "phone"));
