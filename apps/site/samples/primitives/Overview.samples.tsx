import type { Meta, SampleOf } from "../catalog/types";
import { PersonAvatar as Avatar } from "@/shared/ui/foundations/avatar/PersonAvatar";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { icon } from "@/shared/ui/foundations/icons/solar-icon";
import { Comparison } from "../catalog/Comparison";

const meta = { title: "Primitives (기본 부품)/사용 기준", id: "primitives-overview", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Roles: Sample = {
  name: "역할별 부품",
  render: () => <Comparison items={[
    { label: "실행", content: <Button label="저장" /> },
    { label: "만들기", content: <Button label="자료 추가" variant="create" icon={icon("plus")} /> },
    { label: "분류", content: <Token label="디자인 참고" size="sm" /> },
    { label: "상태", content: <StatusDot variant="success" label="완료" /> },
    { label: "개수", content: <Badge label="12" /> },
    { label: "사람", content: <Avatar name="서윤" size="sm" shape="circle" /> },
    { label: "값", content: <TextInput label="이름" isLabelHidden placeholder="이름" value="" onChange={() => {}} width="9rem" /> },
  ]} />,
};
