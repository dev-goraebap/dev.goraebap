import type { Meta, SampleOf } from "../catalog/types";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { useId, useState, type ReactNode } from "react";
import { Comparison } from "../catalog/Comparison";

const meta = { title: "Primitives (기본 부품)/입력", id: "primitives-input", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

/** 라벨과 칸을 id로 잇는다. 칸은 데스크톱 36px · 휴대폰 48px이고 휴대폰 글자는 16px라 확대되지 않는다. */
function Labeled({ label, isRequired, isDisabled, className, children }: {
  label: string; isRequired?: boolean; isDisabled?: boolean; className?: string; children: (id: string) => ReactNode
}) {
  const id = useId();
  return <Field data-disabled={isDisabled || undefined} className={className}>
    <FieldLabel htmlFor={id}>{label}{isRequired ? <span aria-hidden className="text-destructive">*</span> : null}</FieldLabel>
    {children(id)}
  </Field>;
}

function NameField() {
  const [value, setValue] = useState("");
  return <Labeled label="이름" className="w-[min(20rem,100vw-2rem)]">
    {id => <Input id={id} placeholder="이름을 입력하세요" value={value} onChange={event => setValue(event.target.value)} />}
  </Labeled>;
}
export const Basic: Sample = { name: "라벨과 입력", render: () => <NameField /> };
export const States: Sample = {
  name: "상태",
  render: () => <Comparison items={[
    { label: "필수", content: <Labeled label="이름" isRequired className="w-48">{id => <Input id={id} required aria-required />}</Labeled> },
    { label: "읽기 전용", content: <Labeled label="이름" className="w-48">{id => <Input id={id} defaultValue="서윤" readOnly />}</Labeled> },
    { label: "비활성", content: <Labeled label="이름" isDisabled className="w-48">{id => <Input id={id} defaultValue="서윤" disabled />}</Labeled> },
  ]} />,
};

const heights = [{ value: "comfortable", label: "여유 있게" }, { value: "compact", label: "촘촘하게" }];
function Height() {
  const [value, setValue] = useState("comfortable");
  return <Labeled label="목록 높이" className="w-48">
    {id => <Select items={heights} value={value} onValueChange={next => next && setValue(next)}>
      <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>{heights.map(each => <SelectItem key={each.value} value={each.value}>{each.label}</SelectItem>)}</SelectContent>
    </Select>}
  </Labeled>;
}
export const Kinds: Sample = {
  name: "여러 줄과 고르기",
  render: () => <Comparison items={[
    { label: "여러 줄", content: <Labeled label="메모" className="w-56">{id => <Textarea id={id} placeholder="짧은 메모" />}</Labeled> },
    { label: "작은 고정 선택지", content: <Height /> },
  ]} />,
};
