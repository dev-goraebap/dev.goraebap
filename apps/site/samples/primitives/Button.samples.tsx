import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { IconButton } from "@astryxdesign/core/IconButton";
import { icon } from "@/shared/ui/foundations/icons/solar-icon";
import { Comparison } from "../catalog/Comparison";

const meta = {
  title: "Primitives (기본 부품)/버튼", id: "primitives-button", component: Button, layout: "centered",
  args: { label: "저장", variant: "primary" },
} satisfies Meta<typeof Button>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Primary: Sample = { name: "기본" };
export const Variants: Sample = {
  name: "역할과 변형",
  render: () => <Comparison items={[
    { label: "제출", content: <Button label="저장" /> },
    { label: "취소", content: <Button label="취소" variant="ghost" /> },
    { label: "보조", content: <Button label="다시 시도" variant="secondary" /> },
    { label: "되돌리기 어려움", content: <Button label="삭제" variant="destructive" /> },
    { label: "페이지 만들기", content: <Button label="자료 추가" variant="create" icon={icon("plus")} /> },
    { label: "조용한 동작", content: <Button label="모두 지우기" variant="subtle" /> },
  ]} />,
};
export const Tools: Sample = {
  name: "도구와 뷰",
  render: () => <Comparison items={[
    { label: "도구", content: <Button label="검색" variant="tool" isIconOnly icon={icon("search")} /> },
    { label: "켜진 도구", content: <Button label="검색 중" variant="view-active" isIconOnly icon={icon("search", true)} aria-pressed /> },
    { label: "뷰 알약", content: <HStack gap={1}><Button label="리스트" variant="view-active" aria-pressed icon={icon("layout-list", true)} /><Button label="표" variant="view" icon={icon("layout-table")} /></HStack> },
    { label: "아이콘 버튼", content: <IconButton label="더 보기" tooltip="더 보기" variant="ghost" size="sm" icon={icon("more")} /> },
  ]} />,
};
export const Sizes: Sample = {
  name: "크기",
  render: () => <Comparison items={(["sm", "md", "lg"] as const).map(size => ({ label: size, content: <Button label="저장" size={size} /> }))} />,
};
export const States: Sample = {
  name: "상태",
  render: () => <Comparison items={[
    { label: "기본", content: <Button label="저장" /> },
    { label: "비활성", content: <Button label="저장" isDisabled /> },
    { label: "처리 중", content: <Button label="저장" isLoading /> },
  ]} />,
};
