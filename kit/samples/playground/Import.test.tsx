import { test } from "vitest";
import { expect, userEvent, waitFor, within } from "../catalog/testing";
import { runSample } from "../catalog/run-sample";
import type { SampleOf } from "../catalog/types";
import meta from "./Import.samples";

type Sample = SampleOf<typeof meta>;

const VerifyFlow: Sample = {
  name: "단계 흐름과 검증 안내 검증",
  args: { initialPath: "/import" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    // 파일 없이 다음: 올리는 칸 곁에 알린다.
    await userEvent.click(await page.findByRole("button", { name: "다음" }));
    await expect(await page.findByText("가져올 파일을 먼저 올려 주세요.")).toBeInTheDocument();
    const input = canvasElement.ownerDocument.querySelector<HTMLInputElement>("input[type=file]")!;
    await userEvent.upload(input, new File(["성함,이메일\n서윤,a@example.com"], "고객 목록.csv", { type: "text/csv" }));
    await expect(await page.findByText(/14행 · 6열/)).toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "다음" }));
    // 열 맞추기: 짐작한 열이 채워져 있고, 필수 항목을 비우면 다음에서 칸 곁에 알린다.
    await page.findByRole("group", { name: "열 맞추기" });
    await userEvent.click(page.getByRole("combobox", { name: /^이름 \(필수\)/ }));
    await userEvent.click(await page.findByRole("option", { name: "가져오지 않음" }));
    await userEvent.click(page.getByRole("button", { name: "다음" }));
    await waitFor(() => expect(page.getAllByText("이름에 쓸 열을 골라 주세요.").length).toBeGreaterThan(0));
    await userEvent.click(page.getByRole("combobox", { name: /^이름 \(필수\)/ }));
    await userEvent.click(await page.findByRole("option", { name: "성함" }));
    await userEvent.click(page.getByRole("button", { name: "다음" }));
    // 미리보기: 오류 5행. 건너뛰기를 고르지 않으면 가져오지 못한다.
    await expect(await page.findByText("전체 14행 중 오류 5행")).toBeInTheDocument();
    await expect(page.getByText("이메일 형식이 올바르지 않습니다")).toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "가져오기" }));
    await waitFor(() => expect(page.getAllByText("건너뛰거나 이전 단계에서 열을 다시 맞춰 주세요.").length).toBeGreaterThan(0));
    await userEvent.click(page.getByRole("checkbox", { name: /오류 행 건너뛰기/ }));
    await userEvent.click(page.getByRole("button", { name: "가져오기" }));
    // 결과: 가져온 9행, 건너뛴 5행. 완료하면 고객 목록에 들어와 있다.
    await expect(await page.findByText("가져오기를 마쳤습니다", {}, { timeout: 5000 })).toBeInTheDocument();
    const result = page.getByRole("group", { name: "가져오기 결과" });
    await expect(within(result).getByText("9")).toBeInTheDocument();
    await expect(within(result).getByText("5")).toBeInTheDocument();
    await expect(page.getByRole("button", { name: "오류 목록 내려받기" })).toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "완료" }));
    await expect(await page.findByText("seoyun@example.com")).toBeInTheDocument();
  },
};

const VerifyPhone: Sample = {
  name: "휴대폰 미리보기 목록 검증",
  args: { initialPath: "/import/preview", preset: "file" },
  device: "phone",
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const list = await page.findByRole("list", { name: "가져올 행" });
    await expect(within(list).getByText("이메일 형식이 올바르지 않습니다")).toBeInTheDocument();
    await expect(page.queryByRole("navigation", { name: "주 메뉴" })).not.toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "이전" }));
    await expect(await page.findByRole("group", { name: "열 맞추기" })).toBeInTheDocument();
  },
};

test(VerifyFlow.name, () => runSample(meta, VerifyFlow), 40000);
test(VerifyPhone.name, () => runSample(meta, VerifyPhone), 20000);
