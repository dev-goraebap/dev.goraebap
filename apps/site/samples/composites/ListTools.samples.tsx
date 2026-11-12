import type { Meta, SampleOf } from "../catalog/types";
import { useIsMobile } from "@/shared/lib/use-mobile";
import { DisplayChoice, DisplayMenu } from "@/shared/ui/display-menu";
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterDef, type FilterState } from "@/shared/ui/filter";
import { FileTextIcon, UserIcon } from "@/shared/ui/icon";
import { SearchTool } from "@/shared/ui/search-tool";
import { useState } from "react";

type Key = "kind" | "author";
const filters: FilterDef<Key>[] = [
  { key: "kind", label: "종류", icon: FileTextIcon, options: [{ value: "document", label: "문서" }, { value: "link", label: "링크" }, { value: "image", label: "이미지" }] },
  { key: "author", label: "작성자", icon: UserIcon, isSearchable: true,
    options: ["서윤", "지우", "도현", "민준", "하린", "예린", "주원", "시우", "서아", "도윤"].map(name => ({ value: name, label: name })) },
];
type Display = { layout: "list" | "grid"; sort: "updated" | "title"; direction: "desc" | "asc" };
const initial: Display = { layout: "list", sort: "updated", direction: "desc" };

/**
 * 툴바 오른쪽의 도구 묶음(찾기 · 필터 · 표시)과 그 아래 걸린 필터 줄. 값은 실제 화면에서는 주소가 가진다(lib/list-address).
 * 걸린 필터 줄은 데스크톱이 [이름 | 값 | ×] 칩 줄, 휴대폰이 가로로 넘기는 칩이다. 표시만 바꾸면 줄은 생기지 않고 표시 도구에 점이 붙는다.
 */
export function Tools({ query = "", state: start = {} }: { query?: string; state?: FilterState<Key> }) {
  const isMobile = useIsMobile();
  const [words, setWords] = useState(query);
  const [state, setState] = useState<FilterState<Key>>(start);
  const [display, setDisplay] = useState(initial);
  const list = useFilters(filters, { state, onStateChange: setState });
  const isTweaked = (Object.keys(initial) as (keyof Display)[]).some(key => display[key] !== initial[key]);
  const hasApplied = isMobile ? list.active.length > 0 : list.shown.length > 0;
  return <div className="flex w-[min(40rem,100vw-2rem)] flex-col gap-2">
    <div className="flex items-center justify-end gap-1">
      <SearchTool label="자료 검색" placeholder="제목에서 찾기" value={words} onChange={setWords} />
      <FilterMenu filters={list} />
      <DisplayMenu isTweaked={isTweaked} onReset={() => setDisplay(initial)}>
        <DisplayChoice title="레이아웃" value={display.layout} onChange={layout => setDisplay({ ...display, layout })}
          items={[{ value: "list", label: "리스트" }, { value: "grid", label: "그리드" }]} />
        <DisplayChoice title="정렬" value={display.sort} onChange={sort => setDisplay({ ...display, sort })}
          items={[{ value: "updated", label: "수정일" }, { value: "title", label: "제목" }]} />
        <DisplayChoice title="방향" value={display.direction} onChange={direction => setDisplay({ ...display, direction })}
          items={[{ value: "desc", label: "최근 것부터" }, { value: "asc", label: "오래된 것부터" }]} />
      </DisplayMenu>
    </div>
    {hasApplied ? <nav aria-label="적용한 필터">{isMobile ? <FilterChips filters={list} /> : <FilterBar filters={list} />}</nav> : null}
  </div>;
}

const meta = { title: "Composites (조합 부품)/검색·필터·표시", id: "composites-list-tools", layout: "centered", height: "24rem", kit: "shadcn" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Default: Sample = { name: "기본", render: () => <Tools /> };
export const Applied: Sample = { name: "검색어와 필터가 있을 때", render: () => <Tools query="기준" state={{ kind: ["document", "link"], author: ["서윤"] }} /> };
