import type { Meta, SampleOf } from "../catalog/types";
import { Selector } from "@astryxdesign/core/Selector";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useState } from "react";
import { Comparison } from "../catalog/Comparison";

const meta = { title: "Primitives (기본 부품)/입력", id: "primitives-input", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

function Field() {
  const [value, setValue] = useState("");
  return <TextInput label="이름" placeholder="이름을 입력하세요" value={value} onChange={setValue} width="min(20rem, 100vw - 2rem)" />;
}
export const Basic: Sample = { name: "라벨과 입력", render: () => <Field /> };
export const States: Sample = {
  name: "상태",
  render: () => <Comparison items={[
    { label: "필수", content: <TextInput label="이름" isRequired value="" onChange={() => {}} width="12rem" /> },
    { label: "읽기 전용", content: <TextInput label="이름" value="서윤" isReadOnly width="12rem" /> },
    { label: "비활성", content: <TextInput label="이름" value="서윤" isDisabled width="12rem" /> },
  ]} />,
};
export const Kinds: Sample = {
  name: "여러 줄과 고르기",
  render: () => <Comparison items={[
    { label: "여러 줄", content: <TextArea label="메모" placeholder="짧은 메모" value="" onChange={() => {}} width="14rem" /> },
    { label: "작은 고정 선택지", content: <Selector label="목록 높이" value="comfortable" width="12rem"
      options={[{ value: "comfortable", label: "여유 있게" }, { value: "compact", label: "촘촘하게" }]} /> },
  ]} />,
};
