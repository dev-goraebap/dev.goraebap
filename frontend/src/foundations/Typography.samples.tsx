import type { Meta, SampleOf } from "../catalog/types";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

const meta = { title: "Foundations (디자인 기초)/글자", id: "foundations-typography", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Scale: Sample = {
  name: "네 크기의 위계",
  render: () => <VStack gap={3} padding={4} width="min(40rem, 100vw - 2rem)">
    <Heading level={1}>읽기 편한 화면의 글자 리듬</Heading>
    <Text type="large" weight="semibold">작은 제목 · 15px</Text>
    <Text>본문과 행은 13px, 굵기 450, 줄 높이 1.5로 씁니다. 제목과 본문, 보조 정보가 각자의 목소리를 가집니다.</Text>
    <Text type="supporting" color="secondary">보조 정보 · 서윤 · 11월 7일</Text>
  </VStack>,
};

export const Numbers: Sample = {
  name: "숫자와 넘침",
  render: () => <VStack gap={2} padding={4} width="18rem" hAlign="end">
    {["1,204", "87", "12,930"].map(value => <Text key={value} hasTabularNumbers>{value}건</Text>)}
    <Text maxLines={1}>아주 긴 제목이 목록에서는 한 줄에서 말줄임되고 전체는 따로 남습니다</Text>
  </VStack>,
};
