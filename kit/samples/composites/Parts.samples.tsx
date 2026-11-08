import type { Meta, SampleOf } from "../catalog/types";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type { JSONContent } from "@tiptap/react";
import { RichDraft } from "@kit/composites/editor/RichDraft";
import { ListGroupHeader } from "@kit/composites/list-group/ListGroupHeader";
import { DatePill, OptionPill, PropertyPill } from "@kit/composites/property/PropertyPill";
import { PageState, type StateKind } from "@kit/composites/state/PageState";
import { FileDropzone } from "@kit/composites/upload/FileDropzone";
import { icon } from "@kit/foundations/icons/solar-icon";
import { useState } from "react";
import { Comparison } from "../catalog/Comparison";

function Pills() {
  const [kind, setKind] = useState<string>();
  const [labels, setLabels] = useState<string[]>([]);
  const [day, setDay] = useState<string>();
  return <HStack gap={1.5} wrap="wrap" width="min(30rem, 100vw - 2rem)">
    <OptionPill label="컬렉션" icon="folder" isRequired value={kind} onChange={setKind}
      options={[{ value: "design", label: "디자인 참고" }, { value: "development", label: "개발 자료" }, { value: "reading", label: "읽을거리" }]} />
    <OptionPill label="라벨" icon="tag" isMultiple value={labels} onChange={setLabels}
      options={["색", "글자", "간격", "아이콘", "모션", "접근성", "라우팅", "캐시", "양식"].map(value => ({ value, label: value }))} />
    <DatePill label="다시 볼 날" value={day} onChange={setDay} today="2026-11-07" />
    <PropertyPill label="작성자" icon={icon("user")} isEmpty={false} isDisabled text="서윤" />
  </HStack>;
}

function Upload() {
  const [files, setFiles] = useState<string[]>([]);
  return <VStack gap={2} width="min(22rem, 100vw - 2rem)">
    <FileDropzone label="파일 올리기" accept="image/*,.pdf" multiple maxBytes={5 * 1024 ** 2} onPick={picked => setFiles([...files, ...picked.map(file => file.name)])} />
    {files.map(name => <Text key={name} type="supporting">{name}</Text>)}
  </VStack>;
}

function Editor() {
  const [value, setValue] = useState<JSONContent>();
  return <VStack width="min(32rem, 100vw - 2rem)"><RichDraft value={value} onChange={setValue} placeholder="무엇을 남길지 적어 보세요" /></VStack>;
}

function Group() {
  const [isOpen, setOpen] = useState(true);
  return <VStack width="min(32rem, 100vw - 2rem)">
    <ListGroupHeader label="문서" count={4} mark={icon("document")} isOpen={isOpen} onToggle={() => setOpen(!isOpen)} />
    {isOpen ? <Text>그룹의 행이 여기에 놓입니다.</Text> : null}
  </VStack>;
}

const states: [StateKind, string, string][] = [
  ["empty", "아직 자료가 없습니다", "읽을 자료나 남길 기록을 추가해 보세요."],
  ["search", "조건에 맞는 자료가 없습니다", "검색어나 필터를 바꿔 보세요."],
  ["not-found", "자료를 찾을 수 없습니다", "지워졌거나 주소가 바뀌었을 수 있습니다."],
  ["error", "자료를 불러오지 못했습니다", "잠시 후 다시 시도해 주세요."],
];

const meta = { title: "Composites (조합 부품)/속성·올리기·본문·상태", id: "composites-parts", layout: "centered", height: "22rem" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Properties: Sample = { name: "속성 알약", render: () => <Pills /> };
export const Dropzone: Sample = { name: "파일 올리기 칸", render: () => <Upload /> };
export const Body: Sample = { name: "본문 칸", render: () => <Editor /> };
export const GroupHeader: Sample = { name: "그룹 머리", render: () => <Group /> };
export const States: Sample = {
  name: "상태 화면",
  height: "30rem",
  render: () => <Comparison items={states.map(([kind, title, description]) => ({ label: kind, content: <VStack width="18rem"><PageState kind={kind} title={title} description={description} isCompact /></VStack> }))} />,
};
