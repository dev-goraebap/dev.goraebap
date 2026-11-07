import type { Meta, SampleOf } from "../catalog/types";
import { LibraryApp } from "../playground/library/app/LibraryApp";
import { createResourceApi } from "../playground/library/mocks/resource-api";

const meta = {
  title: "Patterns (사용 패턴)/데이터 상태", id: "patterns-data-states", component: LibraryApp,
  layout: "fullscreen", height: "34rem",
  device: "desktop",
} satisfies Meta<typeof LibraryApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Waiting: Sample = { name: "첫 대기", render: () => <LibraryApp api={createResourceApi({ delay: 600_000 })} /> };
export const Failed: Sample = { name: "조회 실패", render: () => <LibraryApp api={createResourceApi({ fail: true, delay: 0 })} /> };
export const Empty: Sample = { name: "빈 목록", render: () => <LibraryApp api={createResourceApi({ initial: [], delay: 0 })} /> };
export const NoResults: Sample = { name: "조건에 맞는 것 없음", render: () => <LibraryApp api={createResourceApi({ delay: 0 })} initialPath="/resources?q=없는검색어" /> };
export const Missing: Sample = { name: "없는 대상", render: () => <LibraryApp api={createResourceApi({ delay: 0 })} initialPath="/resources/unknown" /> };

