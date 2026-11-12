import type { Meta, SampleOf } from "../catalog/types";
import type { JSONContent } from "@tiptap/react";
import { FileDropzone, MB } from "@/shared/ui/compose";
import { RichDraft } from "@/shared/ui/editor";
import { FileTextIcon, FolderIcon, TagIcon, UserIcon } from "@/shared/ui/icon";
import { InfoPill } from "@/shared/ui/info-pill";
import { ListGroupHeader } from "@/shared/ui/list-group-header";
import { PageState, type StateKind } from "@/shared/ui/page-state";
import { DatePill, OptionPill } from "@/shared/ui/property-pill";
import { useState } from "react";
import { Comparison } from "../catalog/Comparison";

const dayText = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" });

/** 속성 알약: 비면 속성의 아이콘과 이름, 정하면 값. 누르면 데스크톱 팝오버 · 휴대폰 바텀시트가 뜬다. 바꿀 수 없는 값은 InfoPill. */
function Pills() {
  const [kind, setKind] = useState<string>();
  const [labels, setLabels] = useState<string[]>([]);
  const [day, setDay] = useState<string>();
  return <div className="flex w-[min(30rem,100vw-2rem)] flex-wrap gap-1.5">
    <OptionPill label="컬렉션" icon={FolderIcon} value={kind} onChange={setKind}
      options={[{ value: "design", label: "디자인 참고" }, { value: "development", label: "개발 자료" }, { value: "reading", label: "읽을거리" }]} />
    <OptionPill label="라벨" icon={TagIcon} isMultiple value={labels} onChange={setLabels}
      options={["색", "글자", "간격", "아이콘", "모션", "접근성", "라우팅", "캐시", "양식"].map(value => ({ value, label: value }))} />
    <DatePill label="다시 볼 날" value={day} onChange={setDay} format={date => dayText.format(new Date(`${date}T00:00`))} />
    <InfoPill label="작성자" icon={<UserIcon />}>서윤</InfoPill>
  </div>;
}

function Upload() {
  const [files, setFiles] = useState<string[]>([]);
  return <div className="flex w-[min(22rem,100vw-2rem)] flex-col gap-2">
    <FileDropzone label="파일 올리기" hint="사진 · PDF · 파일당 최대 5 MB" accept="image/*,.pdf" isMultiple maxBytes={5 * MB}
      onPick={picked => setFiles([...files, ...picked.map(file => file.name)])} />
    {files.map(name => <span key={name} className="text-xs text-muted-foreground">{name}</span>)}
  </div>;
}

function Editor() {
  const [value, setValue] = useState<JSONContent>();
  return <div className="w-[min(32rem,100vw-2rem)]"><RichDraft value={value} onChange={setValue} placeholder="무엇을 남길지 적어 보세요" /></div>;
}

function Group() {
  const [isOpen, setOpen] = useState(true);
  return <div className="w-[min(32rem,100vw-2rem)]">
    <ListGroupHeader label="문서" count={4} icon={<FileTextIcon />} isOpen={isOpen} onToggle={() => setOpen(!isOpen)} />
    {isOpen ? <p className="px-4 py-2 text-sm">그룹의 행이 여기에 놓입니다.</p> : null}
  </div>;
}

const states: [StateKind, string, string][] = [
  ["empty", "아직 자료가 없습니다", "읽을 자료나 남길 기록을 추가해 보세요."],
  ["search", "조건에 맞는 자료가 없습니다", "검색어나 필터를 바꿔 보세요."],
  ["not-found", "자료를 찾을 수 없습니다", "지워졌거나 주소가 바뀌었을 수 있습니다."],
  ["error", "자료를 불러오지 못했습니다", "잠시 후 다시 시도해 주세요."],
];

const meta = { title: "Composites (조합 부품)/속성·올리기·본문·상태", id: "composites-parts", layout: "centered", height: "22rem", kit: "shadcn" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Properties: Sample = { name: "속성 알약", render: () => <Pills /> };
export const Dropzone: Sample = { name: "파일 올리기 칸", render: () => <Upload /> };
export const Body: Sample = { name: "본문 칸", render: () => <Editor /> };
export const GroupHeader: Sample = { name: "그룹 머리", render: () => <Group /> };
/** 그림은 상태마다 세 장 가운데 하나를 고른다. 견본은 같은 그림을 보이도록 첫 장으로 둔다. */
export const States: Sample = {
  name: "상태 화면",
  height: "30rem",
  render: () => <Comparison items={states.map(([kind, title, description]) => ({ label: kind, content: <div className="w-72"><PageState kind={kind} variant={0} title={title} description={description} isCompact /></div> }))} />,
};
