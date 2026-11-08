import type { Meta, SampleOf } from "../catalog/types";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { DisplayMenu, type Display } from "@/shared/ui/composites/filter/DisplayMenu";
import type { FilterState, ListFilter } from "@/shared/ui/composites/filter/types";
import { useFilters } from "@/shared/ui/composites/filter/use-filters";
import { SearchTool } from "@/shared/ui/composites/search/SearchTool";
import { useState } from "react";

const filters: ListFilter[] = [
  { key: "kind", label: "종류", icon: "document", isMultiple: true, options: [{ value: "document", label: "문서" }, { value: "link", label: "링크" }, { value: "image", label: "이미지" }] },
  { key: "author", label: "작성자", icon: "user", isMultiple: true, options: ["서윤", "지우", "도현", "민준", "하린", "예린", "주원", "시우", "서아", "도윤"].map(name => ({ value: name, label: name })) },
];
const initial: Display = { layout: "list", sort: "updated", direction: "desc" };

/** 툴바 오른쪽의 도구 묶음과 그 아래 적용 줄. 값은 실제 화면에서는 주소가 가진다. */
export function Tools({ query = "", state: start = {} }: { query?: string; state?: FilterState }) {
  const [words, setWords] = useState(query);
  const [state, setState] = useState<FilterState>(start);
  const [display, setDisplay] = useState(initial);
  const list = useFilters(filters, { state, onStateChange: setState });
  return <VStack gap={2} width="min(40rem, 100vw - 2rem)">
    <HStack gap={1} hAlign="end" vAlign="center">
      <SearchTool label="자료 검색" placeholder="제목에서 찾기" value={words} onChange={setWords} />
      {list.tools}
      <DisplayMenu layouts={[{ id: "list", label: "리스트", icon: "layout-list" }, { id: "grid", label: "그리드", icon: "layout-grid" }]}
        sorts={[{ id: "updated", label: "수정일", kind: "date" }, { id: "title", label: "제목", kind: "text" }]} value={display} initial={initial} onChange={setDisplay} />
    </HStack>
    {list.applied}
  </VStack>;
}

const meta = { title: "Composites (조합 부품)/검색·필터·표시", id: "composites-list-tools", layout: "centered", height: "24rem" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Default: Sample = { name: "기본", render: () => <Tools /> };
export const Applied: Sample = { name: "검색어와 필터가 있을 때", render: () => <Tools query="기준" state={{ kind: ["document", "link"], author: ["서윤"] }} /> };

