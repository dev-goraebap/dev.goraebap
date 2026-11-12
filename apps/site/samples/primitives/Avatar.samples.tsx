import type { Meta, SampleOf } from "../catalog/types";
import { PersonAvatar as Avatar } from "@/shared/ui/person-avatar";
import { Comparison } from "../catalog/Comparison";

/** 키트 아바타는 원형 하나이고 크기는 className의 size-*로 정한다(기본 20px: 목록 줄 · 활동). 그림이 없으면 이름 첫 글자. */
const meta = {
  title: "Primitives (기본 부품)/아바타", id: "primitives-avatar", component: Avatar, layout: "centered", kit: "shadcn",
  args: { name: "서윤", className: "size-6" },
} satisfies Meta<typeof Avatar>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Basic: Sample = { name: "기본 프로필" };
export const Named: Sample = {
  name: "사진과 이름",
  render: args => <span className="flex items-center gap-1.5 text-sm"><Avatar {...args} className="size-5" />{args.name}</span>,
};
const sizes: [label: string, className: string][] = [["20px · 목록 줄", "size-5"], ["24px", "size-6"], ["32px", "size-8"], ["40px", "size-10"]];
export const Sizes: Sample = {
  name: "크기",
  render: () => <Comparison items={sizes.map(([label, className]) => ({ label, content: <Avatar name="서윤" className={className} /> }))} />,
};
