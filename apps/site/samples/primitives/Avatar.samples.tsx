import type { Meta, SampleOf } from "../catalog/types";
import { PersonAvatar as Avatar } from "@/shared/ui/foundations/avatar/PersonAvatar";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { Comparison } from "../catalog/Comparison";

const meta = {
  title: "Primitives (기본 부품)/아바타", id: "primitives-avatar", component: Avatar, layout: "centered",
  args: { name: "서윤", size: "sm", shape: "circle" },
} satisfies Meta<typeof Avatar>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Basic: Sample = { name: "기본 프로필" };
export const Named: Sample = {
  name: "사진과 이름",
  render: args => <HStack gap={1.5} vAlign="center"><Avatar {...args} size="xsm" /><Text>{args.name}</Text></HStack>,
};
export const Sizes: Sample = {
  name: "크기",
  render: () => <Comparison items={(["xsm", "sm", "md", "lg"] as const).map(size => ({ label: size, content: <Avatar name="서윤" size={size} shape="circle" /> }))} />,
};
