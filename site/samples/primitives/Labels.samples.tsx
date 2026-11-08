import type { Meta, SampleOf } from "../catalog/types";
import { Badge } from "@astryxdesign/core/Badge";
import { HStack } from "@astryxdesign/core/HStack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { icon } from "@/shared/ui/foundations/icons/solar-icon";
import { Comparison } from "../catalog/Comparison";

const meta = { title: "Primitives (기본 부품)/라벨·상태·개수", id: "primitives-labels", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Tokens: Sample = {
  name: "라벨(Token)",
  render: () => <Comparison items={[
    { label: "분류", content: <Token label="디자인 참고" size="sm" /> },
    { label: "아이콘", content: <Token label="문서" size="sm" icon={icon("document")} /> },
    { label: "링크", content: <Token label="개발 자료" size="sm" href="#" /> },
  ]} />,
};
export const Status: Sample = {
  name: "상태(StatusDot)",
  render: () => <Comparison items={(["neutral", "accent", "success", "warning", "error"] as const).map(variant => ({
    label: variant, content: <HStack gap={1.5} vAlign="center"><StatusDot variant={variant} label={variant} /><Text type="supporting">{variant}</Text></HStack>,
  }))} />,
};
export const Counts: Sample = {
  name: "개수(Badge)",
  render: () => <Comparison items={[{ label: "개수", content: <Badge label="3" /> }, { label: "많음", content: <Badge label="99+" /> }]} />,
};
