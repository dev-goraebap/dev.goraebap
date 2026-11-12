import type { Meta, SampleOf } from "../catalog/types";
import * as icons from "@/shared/ui/icon";
import { FolderIcon, LibraryIcon, ListFilterIcon, ListIcon, MoreHorizontalIcon, StarIcon, type Icon } from "@/shared/ui/icon";
import { Comparison } from "../catalog/Comparison";

const meta = { title: "Foundations (디자인 기초)/아이콘", id: "foundations-icons", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

/** 키트 아이콘은 lucide와 같은 이름의 Solar 그림이다. chosen이면 같은 아이콘의 Bold Duotone(고름 · 열림 · 지금 자리). */
const selection: [string, Icon][] = [
  ["LibraryIcon", LibraryIcon], ["StarIcon", StarIcon], ["FolderIcon", FolderIcon],
  ["ListFilterIcon", ListFilterIcon], ["ListIcon", ListIcon], ["MoreHorizontalIcon", MoreHorizontalIcon],
];

export const Selection: Sample = {
  name: "기본과 선택",
  render: () => <Comparison items={selection.map(([name, Each]) => ({
    label: name, content: <span className="flex items-center gap-3 [&_svg]:size-5"><Each /><Each chosen /></span>,
  }))} />,
};

/** 진입점이 내보내는 모든 아이콘(형식 이름은 값이 없어 빠진다). 같은 그림을 두 이름으로 부르는 것도 그대로 보인다. */
const all = Object.entries(icons).filter((entry): entry is [string, Icon] => typeof entry[1] === "function");

export const Names: Sample = {
  name: "의미 이름 목록",
  render: () => <ul aria-label="아이콘" className="m-0 grid w-full max-w-3xl list-none grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3 p-4">
    {all.map(([name, Each]) => <li key={name} className="flex min-w-0 items-center gap-2">
      <Each className="shrink-0" /><span className="truncate font-mono text-xs text-muted-foreground">{name}</span>
    </li>)}
  </ul>,
};
